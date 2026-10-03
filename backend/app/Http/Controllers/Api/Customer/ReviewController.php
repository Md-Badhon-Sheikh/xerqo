<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use App\Models\OrderFeedback;
use App\Models\Review;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    private const WITH = ['product:id,name,slug', 'product.primaryImage', 'order:id,order_number'];

    /**
     * GET /api/me/reviews — the customer's reviews, delivered items still waiting for a review,
     * and their delivery feedback.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $reviews = $user->reviews()->with(self::WITH)->latest()->get();
        $reviewed = $reviews->map(fn (Review $r) => $r->order_id.'-'.$r->product_id)->flip();

        $delivered = $user->orders()->where('status', 'delivered')->with('items')->latest('delivered_at')->get();

        $toReview = $delivered
            ->flatMap(fn (Order $order) => $order->items
                ->filter(fn ($item) => $item->product_id && ! $reviewed->has($order->id.'-'.$item->product_id))
                ->unique('product_id')
                ->map(fn ($item) => [
                    'order_number' => $order->order_number,
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'name' => $item->name,
                    'variant_name' => $item->variant_name,
                    'image' => Media::url($item->image),
                    'delivered_at' => $order->delivered_at?->toIso8601String(),
                ]))
            ->values();

        $feedback = OrderFeedback::where('user_id', $user->id)->with('order:id,order_number,courier,delivered_at')->latest()->get();

        return ReviewResource::collection($reviews)->additional([
            'to_review' => $toReview,
            'feedback' => $feedback->map(fn (OrderFeedback $f) => [
                'id' => $f->id,
                'order_number' => $f->order?->order_number,
                'courier' => $f->order?->courier,
                'delivered_at' => $f->order?->delivered_at?->toIso8601String(),
                ...$f->only([...OrderFeedback::RATINGS, 'nps', 'comment']),
                'created_at' => $f->created_at?->toIso8601String(),
            ]),
            'tags' => Review::TAGS,
        ]);
    }

    /**
     * GET /api/me/orders/{order_number}/review — what the review page needs for one delivered order:
     * each product (with the customer's review if written) and the order's delivery feedback.
     */
    public function order(Request $request, string $orderNumber): JsonResponse
    {
        $order = $request->user()->orders()->where('order_number', $orderNumber)->with('items')->firstOrFail();
        $reviews = Review::where('user_id', $request->user()->id)->where('order_id', $order->id)->with(self::WITH)->get()->keyBy('product_id');
        $feedback = OrderFeedback::where('order_id', $order->id)->first();

        return response()->json([
            'data' => [
                'order_number' => $order->order_number,
                'status' => $order->status,
                'delivered_at' => $order->delivered_at?->toIso8601String(),
                'courier' => $order->courier,
                'can_review' => $order->isDelivered(),
                'items' => $order->items->filter(fn ($i) => $i->product_id)->unique('product_id')->values()->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'name' => $item->name,
                    'variant_name' => $item->variant_name,
                    'qty' => $item->qty,
                    'image' => Media::url($item->image),
                    'review' => isset($reviews[$item->product_id]) ? (new ReviewResource($reviews[$item->product_id]))->toArray($request) : null,
                ]),
                'feedback' => $feedback?->only([...OrderFeedback::RATINGS, 'nps', 'comment']),
                'tags' => Review::TAGS,
            ],
        ]);
    }

    /**
     * POST /api/reviews — only for products in the customer's own DELIVERED orders, once per order item.
     */
    public function store(StoreReviewRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $order = $user->orders()
            ->when(
                ! empty($data['order_number']),
                fn ($q) => $q->where('order_number', $data['order_number']),
                fn ($q) => $q->whereKey($data['order_id']),
            )
            ->first();

        if (! $order) {
            throw ValidationException::withMessages(['order_number' => 'Order not found in your account.']);
        }

        if (! $order->isDelivered()) {
            throw ValidationException::withMessages(['order_number' => 'You can review products once your order has been delivered.']);
        }

        if (! $order->items()->where('product_id', $data['product_id'])->exists()) {
            throw ValidationException::withMessages(['product_id' => 'This product is not part of the order.']);
        }

        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('order_id', $order->id)
            ->where('product_id', $data['product_id'])
            ->exists();

        if ($alreadyReviewed) {
            throw ValidationException::withMessages(['product_id' => 'You have already reviewed this product for this order.']);
        }

        $photos = [];
        foreach ($request->file('photos', []) as $photo) {
            $photos[] = Media::store($photo, 'reviews');
        }

        $review = Review::create([
            'user_id' => $user->id,
            'product_id' => $data['product_id'],
            'order_id' => $order->id,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'body' => $data['body'] ?? null,
            'tags' => array_values(array_intersect(Review::TAGS, $data['tags'] ?? [])) ?: null,
            'is_anonymous' => (bool) ($data['is_anonymous'] ?? false),
            'photos' => $photos ?: null,
            'status' => Review::STATUS_PENDING, // published after admin approval
            'delivery_rating' => $data['delivery_rating'] ?? null,
            'courier_rating' => $data['courier_rating'] ?? null,
            'packaging_rating' => $data['packaging_rating'] ?? null,
        ]);

        return (new ReviewResource($review->load(self::WITH)))
            ->additional(['message' => 'Thanks! Your review will appear after moderation.'])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/reviews/{review} — edit your own review. An edited review goes back to moderation.
     */
    public function update(Request $request, Review $review): ReviewResource
    {
        abort_unless($review->user_id === $request->user()->id, 404);

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:150'],
            'body' => ['nullable', 'string', 'max:3000'],
            'tags' => ['nullable', 'array', 'max:7'],
            'tags.*' => ['string', Rule::in(Review::TAGS)],
            'is_anonymous' => ['boolean'],
        ]);

        $review->update([
            ...$data,
            'tags' => ($data['tags'] ?? []) ?: null,
            'status' => Review::STATUS_PENDING,
            'is_featured' => false,
        ]);

        return new ReviewResource($review->load(self::WITH));
    }

    /**
     * DELETE /api/reviews/{review}
     */
    public function destroy(Request $request, Review $review): JsonResponse
    {
        abort_unless($review->user_id === $request->user()->id, 404);

        foreach ($review->photos ?? [] as $path) {
            Media::delete($path);
        }
        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }

    /**
     * POST /api/me/orders/{order_number}/feedback — private delivery & service feedback (can be updated).
     */
    public function feedback(Request $request, string $orderNumber): JsonResponse
    {
        $order = $request->user()->orders()->where('order_number', $orderNumber)->firstOrFail();

        if (! $order->isDelivered()) {
            throw ValidationException::withMessages(['order' => 'You can leave feedback once your order has been delivered.']);
        }

        $data = $request->validate([
            'delivery_rating' => ['nullable', 'integer', 'between:1,5'],
            'packaging_rating' => ['nullable', 'integer', 'between:1,5'],
            'courier_rating' => ['nullable', 'integer', 'between:1,5'],
            'support_rating' => ['nullable', 'integer', 'between:1,5'],
            'nps' => ['nullable', 'integer', 'between:0,10'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! array_filter($data, fn ($v) => $v !== null && $v !== '')) {
            throw ValidationException::withMessages(['delivery_rating' => 'Rate at least one thing.']);
        }

        $feedback = OrderFeedback::updateOrCreate(['order_id' => $order->id], [...$data, 'user_id' => $request->user()->id]);

        return response()->json(['message' => 'Thanks for the feedback!', 'data' => $feedback->only([...OrderFeedback::RATINGS, 'nps', 'comment'])]);
    }
}
