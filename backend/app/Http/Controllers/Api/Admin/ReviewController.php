<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    /**
     * GET /api/admin/reviews?status=pending&rating=&product_id=
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $reviews = Review::query()
            ->with(['user:id,name,phone', 'product:id,name,slug', 'order:id,order_number'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->filled('rating'), fn ($q) => $q->where('rating', $request->integer('rating')))
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 100))
            ->withQueryString();

        return ReviewResource::collection($reviews)->additional([
            'counts' => Review::selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status'),
        ]);
    }

    public function approve(Review $review): ReviewResource
    {
        $review->update(['status' => Review::STATUS_APPROVED]);

        return new ReviewResource($review->load(['user:id,name,phone', 'product:id,name,slug', 'order:id,order_number']));
    }

    public function reject(Review $review): ReviewResource
    {
        $review->update(['status' => Review::STATUS_REJECTED]);

        return new ReviewResource($review->load(['user:id,name,phone', 'product:id,name,slug', 'order:id,order_number']));
    }

    public function destroy(Review $review): JsonResponse
    {
        foreach ($review->photos ?? [] as $path) {
            Media::delete($path);
        }

        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }
}
