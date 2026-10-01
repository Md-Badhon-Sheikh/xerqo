<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use App\Models\Review;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    /**
     * GET /api/me/reviews — the customer's reviews plus delivered items still waiting for a review.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $reviews = $user->reviews()->with(['product:id,name,slug', 'order:id,order_number'])->latest()->get();
        $reviewed = $reviews->map(fn (Review $r) => $r->order_id.'-'.$r->product_id)->flip();

        $toReview = $user->orders()
            ->where('status', 'delivered')
            ->with('items')
            ->latest('delivered_at')
            ->get()
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

        return ReviewResource::collection($reviews)->additional(['to_review' => $toReview]);
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
            'photos' => $photos ?: null,
            'status' => Review::STATUS_PENDING, // published after admin approval
            'delivery_rating' => $data['delivery_rating'] ?? null,
            'courier_rating' => $data['courier_rating'] ?? null,
            'packaging_rating' => $data['packaging_rating'] ?? null,
        ]);

        return (new ReviewResource($review->load(['product:id,name,slug', 'order:id,order_number'])))
            ->additional(['message' => 'Thanks! Your review will appear after moderation.'])
            ->response()
            ->setStatusCode(201);
    }
}
