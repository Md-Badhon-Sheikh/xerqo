<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ReviewResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    private const SORTS = 'featured,newest,price_asc,price_desc,popular,rating,name';

    /**
     * GET /api/products
     *
     * Query: category (slug, includes sub-categories), brand (slug or slug[]), color (colour name),
     *        q, min_price, max_price, in_stock=1, engravable=1, featured=1, on_sale=1,
     *        sort=featured|newest|price_asc|price_desc|popular|rating|name, per_page (max 60), page,
     *        with_facets=1 (adds meta "facets": price range, brands and colours for the filter sidebar)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'category' => ['nullable', 'string', 'max:120'],
            'brand' => ['nullable'],
            'brand.*' => ['string', 'max:120'],
            'color' => ['nullable', 'string', 'max:60'],
            'q' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'sort' => ['nullable', 'in:'.self::SORTS],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        // Category + search narrow the listing; facets are counted inside this scope
        $scope = Product::active();
        $this->applyCategory($scope, $request);
        $this->applySearch($scope, $request);

        $query = (clone $scope)->forCard();

        if ($request->filled('brand')) {
            $slugs = (array) $request->input('brand');
            $query->whereHas('brand', fn (Builder $q) => $q->whereIn('slug', $slugs));
        }

        if ($request->filled('color')) {
            $query->whereHas('variants', fn (Builder $q) => $q->where('is_active', true)->where('name', (string) $request->input('color')));
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

        if ($request->boolean('featured')) {
            $query->featured();
        }

        if ($request->boolean('on_sale')) {
            $query->where(fn (Builder $q) => $q->whereColumn('compare_price', '>', 'price')->orWhereHas('activeFlashItem'));
        }

        match ($request->input('sort', 'featured')) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'name' => $query->orderBy('name'),
            'rating' => $query->orderByDesc('rating')->orderByDesc('reviews_count'),
            'popular' => $query->withSum(['orderItems as sold_qty'], 'qty')->orderByDesc('sold_qty'),
            'newest' => $query->latest('id'),
            default => $query->orderByDesc('is_featured')->latest('id'),
        };
        $query->orderBy('id'); // stable pagination

        $collection = ProductResource::collection(
            $query->paginate($request->integer('per_page', 24))->withQueryString()
        );

        return $request->boolean('with_facets')
            ? $collection->additional(['facets' => $this->facets($scope)])
            : $collection;
    }

    /**
     * GET /api/products/{slug}
     */
    public function show(string $slug): ProductResource
    {
        $product = Product::active()
            ->where('slug', $slug)
            ->with(['category', 'brand', 'images', 'activeFlashItem.flashSale', 'variants' => fn ($q) => $q->where('is_active', true)->orderBy('id')])
            ->withRating()
            ->firstOrFail();

        // let each variant price itself from the product (flash sale aware) without extra queries
        $product->variants->each->setRelation('product', $product);

        // Same category first, then same brand to fill the row
        $related = Product::active()
            ->whereKeyNot($product->id)
            ->where(fn (Builder $q) => $q->where('category_id', $product->category_id)
                ->when($product->brand_id, fn (Builder $q) => $q->orWhere('brand_id', $product->brand_id)))
            ->forCard()
            ->orderByRaw('category_id = ? desc', [$product->category_id])
            ->orderByDesc('is_featured')
            ->latest('id')
            ->limit(8)
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

    private function applyCategory(Builder $query, Request $request): void
    {
        if (! $request->filled('category')) {
            return;
        }

        $category = Category::active()->where('slug', (string) $request->input('category'))->first();
        $ids = $category
            ? $category->children()->pluck('id')->push($category->id)->all()
            : [0];

        $query->whereIn('category_id', $ids);
    }

    private function applySearch(Builder $query, Request $request): void
    {
        if (! $request->filled('q')) {
            return;
        }

        $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], trim((string) $request->input('q'))).'%';
        $query->where(fn (Builder $q) => $q->where('products.name', 'like', $term)
            ->orWhere('products.sku', 'like', $term)
            ->orWhere('products.description', 'like', $term)
            ->orWhereHas('category', fn (Builder $c) => $c->where('name', 'like', $term))
            ->orWhereHas('brand', fn (Builder $b) => $b->where('name', 'like', $term)));
    }

    /**
     * Filter options available within the current category/search scope.
     *
     * @return array{price: array{min: float, max: float}, brands: mixed, colors: mixed, categories: mixed}
     */
    private function facets(Builder $scope): array
    {
        $ids = (clone $scope)->select('products.id');

        $brands = Brand::active()
            ->withCount(['products' => fn (Builder $q) => $q->whereIn('products.id', clone $ids)])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->filter(fn (Brand $b) => $b->products_count > 0)
            ->map(fn (Brand $b) => ['name' => $b->name, 'slug' => $b->slug, 'count' => $b->products_count])
            ->values();

        $colors = ProductVariant::query()
            ->where('is_active', true)
            ->whereIn('product_id', clone $ids)
            ->selectRaw('name, MAX(color_hex) as hex, COUNT(DISTINCT product_id) as total')
            ->groupBy('name')
            ->orderByDesc('total')
            ->orderBy('name')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'hex' => $row->hex, 'count' => (int) $row->total])
            ->values();

        $range = (clone $scope)->toBase()->selectRaw('MIN(price) as min_price, MAX(price) as max_price')->first();

        // per-category counts — used as result chips on the search page
        $categories = (clone $scope)->toBase()
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->selectRaw('categories.name, categories.slug, COUNT(*) as total')
            ->groupBy('categories.id', 'categories.name', 'categories.slug')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'slug' => $row->slug, 'count' => (int) $row->total])
            ->values();

        return [
            'price' => ['min' => (float) ($range->min_price ?? 0), 'max' => (float) ($range->max_price ?? 0)],
            'brands' => $brands,
            'colors' => $colors,
            'categories' => $categories,
        ];
    }
}
