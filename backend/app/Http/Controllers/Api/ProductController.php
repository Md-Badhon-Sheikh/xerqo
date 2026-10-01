<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ReviewResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * GET /api/products
     *
     * Query: category (slug), q, min_price, max_price, in_stock=1, engravable=1,
     *        sort=newest|price_asc|price_desc|popular|rating|name, per_page (max 60), page
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'category' => ['nullable', 'string', 'max:120'],
            'q' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'sort' => ['nullable', 'in:newest,price_asc,price_desc,popular,rating,name'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        $query = Product::active()
            ->with(['category', 'primaryImage'])
            ->withRating();

        if ($request->filled('category')) {
            $category = Category::active()->where('slug', (string) $request->input('category'))->first();
            $ids = $category
                ? $category->children()->pluck('id')->push($category->id)->all()
                : [0];

            $query->whereIn('category_id', $ids);
        }

        if ($request->filled('q')) {
            $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], trim((string) $request->input('q'))).'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)
                ->orWhere('sku', 'like', $term)
                ->orWhere('description', 'like', $term));
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->float('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->float('max_price'));
        }

        if ($request->boolean('in_stock')) {
            $query->where('stock', '>', 0);
        }

        if ($request->boolean('engravable')) {
            $query->where('is_engravable', true);
        }

        match ($request->input('sort', 'newest')) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'name' => $query->orderBy('name'),
            'rating' => $query->orderByDesc('rating')->orderByDesc('reviews_count'),
            'popular' => $query->withSum(['orderItems as sold_qty'], 'qty')->orderByDesc('sold_qty'),
            default => $query->latest('id'),
        };

        return ProductResource::collection(
            $query->paginate($request->integer('per_page', 24))->withQueryString()
        );
    }

    /**
     * GET /api/products/{slug}
     */
    public function show(string $slug): ProductResource
    {
        $product = Product::active()
            ->where('slug', $slug)
            ->with(['category', 'images', 'variants' => fn ($q) => $q->where('is_active', true)])
            ->withRating()
            ->firstOrFail();

        $related = Product::active()
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->with(['primaryImage'])
            ->withRating()
            ->inRandomOrder()
            ->limit(4)
            ->get();

        return (new ProductResource($product))->additional([
            'related' => ProductResource::collection($related),
        ]);
    }

    /**
     * GET /api/products/{slug}/reviews — approved reviews + rating breakdown.
     */
    public function reviews(Request $request, string $slug): AnonymousResourceCollection
    {
        $product = Product::active()->where('slug', $slug)->firstOrFail();

        $reviews = $product->approvedReviews()
            ->with('user:id,name')
            ->latest()
            ->paginate(min($request->integer('per_page', 10), 50));

        $breakdown = Review::query()
            ->where('product_id', $product->id)
            ->where('status', Review::STATUS_APPROVED)
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        $count = (int) $breakdown->sum();
        $average = $count > 0
            ? round($breakdown->map(fn ($total, $rating) => $total * $rating)->sum() / $count, 1)
            : null;

        return ReviewResource::collection($reviews)->additional([
            'summary' => [
                'average' => $average,
                'count' => $count,
                'breakdown' => collect([5, 4, 3, 2, 1])->mapWithKeys(fn ($star) => [$star => (int) ($breakdown[$star] ?? 0)]),
            ],
        ]);
    }
}
