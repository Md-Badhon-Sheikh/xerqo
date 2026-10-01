<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
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
            ->with(['category', 'primaryImage'])
            ->withCount('variants')
            ->withRating()
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('sku', 'like', $term));
            })
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->input('stock') === 'low', fn ($q) => $q->whereColumn('stock', '<=', 'low_stock_threshold')->where('stock', '>', 0))
            ->when($request->input('stock') === 'out', fn ($q) => $q->where('stock', 0))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 20), 100))
            ->withQueryString();

        return ProductResource::collection($products);
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
            $product->update($request->safe()->except(['images', 'variants']));

            if ($request->has('variants')) {
                $this->syncVariants($product, $request->validated('variants'));
            }

            $this->storeImages($product, $request->file('images', []));
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
     * @param  array<int, \Illuminate\Http\UploadedFile>  $files
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

        $product->variants()->whereNotIn('id', $keep)->delete();
    }

    private function loadDetail(Product $product): Product
    {
        return $product->load(['category', 'images', 'variants'])
            ->loadAvg('approvedReviews as rating', 'rating')
            ->loadCount('approvedReviews as reviews_count');
    }
}
