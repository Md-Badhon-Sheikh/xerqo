<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BannerResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\FlashSaleResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ReviewResource;
use App\Models\Banner;
use App\Models\Category;
use App\Models\FlashSale;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    private const SECTION_PRODUCTS = 10;

    /**
     * GET /api/home — everything the storefront home page needs in one request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $countActive = ['products' => fn (Builder $q) => $q->where('status', 'active')];

        $categories = Category::active()
            ->whereNull('parent_id')
            ->withCount($countActive)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        // Category product sliders ("Wallets", "Long Wallets", …) — categories marked show_on_home
        $sections = $categories->where('show_on_home', true)->values()->map(function (Category $category) {
            $ids = $category->children()->pluck('id')->push($category->id);

            return [
                'category' => new CategoryResource($category),
                'products' => ProductResource::collection(
                    Product::active()->whereIn('category_id', $ids)->forCard()
                        ->orderByDesc('is_featured')->latest('id')
                        ->limit(self::SECTION_PRODUCTS)->get()
                ),
            ];
        })->filter(fn (array $section) => $section['products']->collection->isNotEmpty())->values();

        $flash = FlashSale::live()->orderBy('ends_at')->first();
        if ($flash) {
            $productIds = $flash->items()->pluck('product_id');
            $products = Product::active()->whereIn('id', $productIds)->forCard()->get()
                ->sortBy(fn (Product $p) => $productIds->search($p->id))->values();
            $flash->setRelation('products', $products);
        }

        // Best sellers by units sold (cancelled orders excluded); featured products fill any gap
        $topSelling = Product::active()->forCard()
            ->withSum(['orderItems as sold_qty' => fn (Builder $q) => $q->whereHas('order', fn (Builder $o) => $o->where('status', '!=', 'cancelled'))], 'qty')
            ->orderByDesc('sold_qty')
            ->orderByDesc('is_featured')
            ->latest('id')
            ->limit(4)
            ->get();

        $reviews = Review::query()
            ->where('status', Review::STATUS_APPROVED)
            ->where('rating', '>=', 4)
            ->whereNotNull('body')
            ->with(['user:id,name', 'user.addresses:id,user_id,district'])
            ->latest()
            ->limit(3)
            ->get();

        return response()->json([
            'banners' => BannerResource::collection(Banner::live()->where('position', 'home_hero')->orderBy('sort_order')->get()),
            'categories' => CategoryResource::collection($categories),
            'flash_sale' => $flash && $flash->products->isNotEmpty() ? new FlashSaleResource($flash) : null,
            'top_selling' => ProductResource::collection($topSelling),
            'sections' => $sections,
            'reviews' => $reviews->map(fn (Review $r) => [
                ...(new ReviewResource($r))->toArray($request),
                'city' => $r->user?->addresses->first()?->district,
            ]),
        ]);
    }
}
