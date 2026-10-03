<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Support\Media;
use App\Support\StockLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /**
     * GET /api/admin/products?q=&category_id=&status=&stock=low|out&per_page=
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->with(['category', 'brand', 'primaryImage'])
            ->withCount('variants')
            ->withRating()
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('sku', 'like', $term));
            })
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->filled('brand_id'), fn ($q) => $q->where('brand_id', $request->integer('brand_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->when($request->input('stock') === 'in', fn ($q) => $q->whereColumn('stock', '>', 'low_stock_threshold'))
            ->when($request->input('stock') === 'low', fn ($q) => $q->whereColumn('stock', '<=', 'low_stock_threshold')->where('stock', '>', 0))
            ->when($request->input('stock') === 'out', fn ($q) => $q->where('stock', 0))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 20), 100))
            ->withQueryString();

        // tab counts for the product list
        $counts = Product::query()->toBase()->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
            SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as hidden,
            SUM(CASE WHEN stock > 0 AND stock <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock,
            SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock
        ")->first();

        return ProductResource::collection($products)->additional([
            'counts' => array_map('intval', (array) $counts),
        ]);
    }

    /**
     * POST /api/admin/products (multipart/form-data when uploading images[])
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            $product = Product::create($request->safe()->except(['images', 'variants']));

            $this->syncVariants($product, $request->validated('variants'));
            $this->storeImages($product, $request->file('images', []));
            StockLedger::record($product->id, null, $product->stock, $product->stock, 'edit', 'Opening stock', null, $request->user()->id);

            return $product;
        });

        return (new ProductResource($this->loadDetail($product)))->response()->setStatusCode(201);
    }

    /**
     * GET /api/admin/products/{id}
     */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($this->loadDetail($product));
    }

    /**
     * PUT /api/admin/products/{id} (use POST + _method=PUT for multipart uploads)
     */
    public function update(ProductRequest $request, Product $product): ProductResource
    {
        DB::transaction(function () use ($request, $product) {
            $before = $product->stock;
            $product->update($request->safe()->except(['images', 'variants']));

            if ($request->has('variants')) {
                $this->syncVariants($product, $request->validated('variants'));
            }

            $this->storeImages($product, $request->file('images', []));

            $product->refresh();
            StockLedger::record($product->id, null, $product->stock - $before, $product->stock, 'edit', 'Edited in product form', null, $request->user()->id);
        });

        return new ProductResource($this->loadDetail($product->refresh()));
    }

    /**
     * DELETE /api/admin/products/{id}
     */
    public function destroy(Product $product): JsonResponse
    {
        $paths = $product->images()->pluck('path');

        $product->delete();

        $paths->each(fn ($path) => Media::delete($path));

        return response()->json(['message' => 'Product deleted.']);
    }

    /**
     * POST /api/admin/products/{id}/images (multipart: images[])
     */
    public function uploadImages(Request $request, Product $product): ProductResource
    {
        $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $this->storeImages($product, $request->file('images', []));

        return new ProductResource($this->loadDetail($product));
    }

    /**
     * PATCH /api/admin/products/{id}/images/reorder {"order": [5, 3, 4]} — first id becomes the main image.
     */
    public function reorderImages(Request $request, Product $product): ProductResource
    {
        $data = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['integer'],
        ]);

        foreach (array_values($data['order']) as $position => $imageId) {
            $product->images()->whereKey($imageId)->update(['sort_order' => $position]);
        }

        return new ProductResource($this->loadDetail($product));
    }

    /**
     * DELETE /api/admin/products/{id}/images/{image}
     */
    public function destroyImage(Product $product, ProductImage $image): JsonResponse
    {
        abort_unless((int) $image->product_id === (int) $product->id, 404);

        Media::delete($image->path);
        $image->delete();

        return response()->json(['message' => 'Image deleted.']);
    }

    /**
     * @param  array<int, UploadedFile>  $files
     */
    private function storeImages(Product $product, array $files): void
    {
        // Query the table directly: the images() relation carries an ORDER BY that MySQL rejects in aggregates.
        $existing = ProductImage::where('product_id', $product->id);
        $position = $existing->exists() ? ((int) $existing->max('sort_order')) + 1 : 0;

        foreach ($files as $file) {
            $product->images()->create([
                'path' => Media::store($file, 'products'),
                'alt' => $product->name,
                'sort_order' => $position++,
            ]);
        }
    }

    /**
     * Sync variants: update rows with an id, create rows without, delete the rest.
     *
     * @param  array<int, array<string, mixed>>|null  $variants
     */
    private function syncVariants(Product $product, ?array $variants): void
    {
        if ($variants === null) {
            return;
        }

        $keep = [];

        foreach ($variants as $index => $row) {
            $attributes = [
                'name' => $row['name'],
                'color_hex' => $row['color_hex'] ?? null,
                'sku' => isset($row['sku']) && $row['sku'] !== '' ? strtoupper($row['sku']) : null,
                'price' => $row['price'] ?? null,
                'stock' => (int) $row['stock'],
                'is_active' => (bool) ($row['is_active'] ?? true),
            ];

            if ($attributes['sku'] !== null) {
                $clash = ProductVariant::query()
                    ->where('sku', $attributes['sku'])
                    ->when(! empty($row['id']), fn ($q) => $q->whereKeyNot($row['id']))
                    ->exists();

                if ($clash) {
                    throw ValidationException::withMessages(["variants.{$index}.sku" => 'This variant SKU is already in use.']);
                }
            }

            if (! empty($row['id'])) {
                $variant = $product->variants()->whereKey($row['id'])->first();

                if (! $variant) {
                    throw ValidationException::withMessages(["variants.{$index}.id" => 'Variant does not belong to this product.']);
                }

                $variant->update($attributes);
            } else {
                $variant = $product->variants()->create($attributes);
            }

            $keep[] = $variant->id;
        }

        $removed = $product->variants()->whereNotIn('id', $keep)->get();
        $removed->each(fn (ProductVariant $v) => Media::delete($v->image));
        $product->variants()->whereNotIn('id', $keep)->delete();

        // a product with colour options is in stock exactly as much as its options are
        if ($keep !== []) {
            $product->update(['stock' => (int) $product->variants()->sum('stock')]);
        }
    }

    /**
     * POST /api/admin/products/{id}/variants/{variant}/image (multipart: image) — photo shown when that colour is picked.
     */
    public function uploadVariantImage(Request $request, Product $product, ProductVariant $variant): ProductResource
    {
        abort_unless((int) $variant->product_id === (int) $product->id, 404);
        $request->validate(['image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096']]);

        Media::delete($variant->image);
        $variant->update(['image' => Media::store($request->file('image'), 'products')]);

        return new ProductResource($this->loadDetail($product));
    }

    /**
     * DELETE /api/admin/products/{id}/variants/{variant}/image
     */
    public function destroyVariantImage(Product $product, ProductVariant $variant): ProductResource
    {
        abort_unless((int) $variant->product_id === (int) $product->id, 404);

        Media::delete($variant->image);
        $variant->update(['image' => null]);

        return new ProductResource($this->loadDetail($product));
    }

    private function loadDetail(Product $product): Product
    {
        return $product->load(['category', 'brand', 'images', 'variants' => fn ($q) => $q->orderBy('id')])
            ->loadAvg('approvedReviews as rating', 'rating')
            ->loadCount('approvedReviews as reviews_count');
    }
}
