<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\OrderFeedback;
use App\Models\Review;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    private const WITH = ['user:id,name,phone', 'product:id,name,slug', 'product.primaryImage', 'order:id,order_number'];

    /**
     * GET /api/admin/reviews?status=pending|approved|rejected|featured&rating=&q=&photos=1
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in([Review::STATUS_PENDING, Review::STATUS_APPROVED, Review::STATUS_REJECTED, 'featured'])],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $reviews = Review::query()
            ->with(self::WITH)
            ->when($request->input('status') === 'featured', fn ($q) => $q->where('is_featured', true))
            ->when(in_array($request->input('status'), [Review::STATUS_PENDING, Review::STATUS_APPROVED, Review::STATUS_REJECTED], true), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('rating'), fn ($q) => $q->where('rating', $request->integer('rating')))
            ->when($request->boolean('photos'), fn ($q) => $q->whereNotNull('photos'))
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('body', 'like', $term)->orWhere('title', 'like', $term)
                    ->orWhereHas('product', fn ($p) => $p->where('name', 'like', $term))
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term)->orWhere('phone', 'like', $term)));
            })
            ->latest()
            ->latest('id')
            ->paginate(min($request->integer('per_page', 15), 100))
            ->withQueryString();

        $byStatus = Review::selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
        $approved = Review::where('status', Review::STATUS_APPROVED);

        return ReviewResource::collection($reviews)->additional([
            'counts' => [
                'pending' => (int) ($byStatus[Review::STATUS_PENDING] ?? 0),
                'approved' => (int) ($byStatus[Review::STATUS_APPROVED] ?? 0),
                'rejected' => (int) ($byStatus[Review::STATUS_REJECTED] ?? 0),
                'featured' => Review::where('is_featured', true)->count(),
                'all' => (int) $byStatus->sum(),
            ],
            'summary' => [
                'average' => round((float) (clone $approved)->avg('rating'), 1),
                'average_last_month' => round((float) (clone $approved)->where('created_at', '<', now()->startOfMonth())->avg('rating'), 1),
                'photo_reviews' => (clone $approved)->whereNotNull('photos')->count(),
                'nps' => $this->feedbackSummary(now()->subDays(30))['nps'],
            ],
            'tags' => Review::TAGS,
        ]);
    }

    public function approve(Review $review): ReviewResource
    {
        $review->update(['status' => Review::STATUS_APPROVED]);

        return new ReviewResource($review->load(self::WITH));
    }

    public function reject(Review $review): ReviewResource
    {
        $review->update(['status' => Review::STATUS_REJECTED, 'is_featured' => false]);

        return new ReviewResource($review->load(self::WITH));
    }

    /**
     * PATCH /api/admin/reviews/{review}/reply {"reply": "Thank you!"} — a public reply; null removes it.
     */
    public function reply(Request $request, Review $review): ReviewResource
    {
        $data = $request->validate(['reply' => ['nullable', 'string', 'max:1000']]);
        $reply = filled($data['reply'] ?? null) ? trim($data['reply']) : null;

        $review->update([
            'admin_reply' => $reply,
            'replied_at' => $reply ? now() : null,
            'replied_by' => $reply ? $request->user()->id : null,
        ]);

        return new ReviewResource($review->load(self::WITH));
    }

    /**
     * PATCH /api/admin/reviews/{review}/feature {"is_featured": true} — featured reviews lead on the home page.
     */
    public function feature(Request $request, Review $review): ReviewResource
    {
        $data = $request->validate(['is_featured' => ['required', 'boolean']]);

        if ($data['is_featured'] && $review->status !== Review::STATUS_APPROVED) {
            abort(422, 'Approve the review before featuring it.');
        }

        $review->update($data);

        return new ReviewResource($review->load(self::WITH));
    }

    public function destroy(Review $review): JsonResponse
    {
        foreach ($review->photos ?? [] as $path) {
            Media::delete($path);
        }

        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }

    /**
     * GET /api/admin/reviews/feedback?days=30 — private delivery & service feedback with averages and NPS.
     */
    public function feedback(Request $request): JsonResponse
    {
        $days = in_array($request->integer('days'), [7, 30, 90, 365], true) ? $request->integer('days') : 30;
        $from = now()->subDays($days);

        $page = OrderFeedback::with(['order:id,order_number,courier,district', 'user:id,name,phone'])
            ->where('created_at', '>=', $from)
            ->latest()
            ->paginate(min($request->integer('per_page', 10), 50));

        return response()->json([
            'data' => $page->getCollection()->map(fn (OrderFeedback $f) => [
                'id' => $f->id,
                'order_number' => $f->order?->order_number,
                'courier' => $f->order?->courier,
                'district' => $f->order?->district,
                'customer' => $f->user?->name,
                'delivery_rating' => $f->delivery_rating,
                'packaging_rating' => $f->packaging_rating,
                'courier_rating' => $f->courier_rating,
                'support_rating' => $f->support_rating,
                'nps' => $f->nps,
                'comment' => $f->comment,
                'created_at' => $f->created_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'from' => $page->firstItem(), 'to' => $page->lastItem(), 'total' => $page->total()],
            'summary' => $this->feedbackSummary($from),
        ]);
    }

    /**
     * Averages per question and the Net Promoter Score (% 9–10 minus % 0–6).
     *
     * @return array<string, mixed>
     */
    private function feedbackSummary(\DateTimeInterface $from): array
    {
        $rows = OrderFeedback::where('created_at', '>=', $from);
        $scores = (clone $rows)->whereNotNull('nps')->pluck('nps');
        $n = $scores->count();
        $promoters = $n ? round($scores->filter(fn ($s) => $s >= 9)->count() / $n * 100) : 0;
        $detractors = $n ? round($scores->filter(fn ($s) => $s <= 6)->count() / $n * 100) : 0;

        $latest = (clone $rows)->whereNotNull('comment')->with(['user:id,name', 'order:id,district'])->latest()->first();

        return [
            'responses' => (clone $rows)->count(),
            'averages' => collect(OrderFeedback::RATINGS)->mapWithKeys(fn ($k) => [$k => round((float) (clone $rows)->avg($k), 1)]),
            'nps' => $n ? (int) ($promoters - $detractors) : null,
            'promoters' => (int) $promoters,
            'passives' => $n ? (int) (100 - $promoters - $detractors) : 0,
            'detractors' => (int) $detractors,
            'latest_comment' => $latest ? ['comment' => $latest->comment, 'name' => $latest->user?->name, 'district' => $latest->order?->district] : null,
        ];
    }
}
