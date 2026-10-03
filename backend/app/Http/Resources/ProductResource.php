<?php

namespace App\Http\Resources;

use App\Models\Product;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isStaff = (bool) $request->user()?->isStaff();
        // The admin panel edits the stored prices; the storefront shows what the customer pays now.
        $admin = $request->is('api/admin/*');
        $image = $this->relationLoaded('primaryImage')
            ? $this->primaryImage?->path
            : ($this->relationLoaded('images') ? $this->images->first()?->path : null);
        $flash = ! $admin && $this->relationLoaded('activeFlashItem') && $this->activeFlashItem
            && $this->activeFlashItem->sale_price < $this->price
            ? $this->activeFlashItem
            : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'brand' => $this->whenLoaded('brand', fn () => $this->brand ? [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ] : null),
            'description' => $this->description,
            'price' => $admin ? $this->price : $this->sellingPrice(),
            'compare_price' => $admin ? $this->compare_price : $this->listPrice(),
            'discount_percent' => $admin
                ? ($this->compare_price > $this->price ? (int) round((($this->compare_price - $this->price) / $this->compare_price) * 100) : 0)
                : $this->discountPercent(),
            'flash_sale' => $flash ? [
                'id' => $flash->flash_sale_id,
                'title' => $flash->flashSale?->title,
                'ends_at' => $flash->flashSale?->ends_at?->toIso8601String(),
            ] : null,
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'is_engravable' => $this->is_engravable,
            'is_featured' => $this->is_featured,
            'badge' => $this->badge,
            'image' => Media::url($image),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            // cards use this to send shoppers to the product page to pick a colour first
            'has_variants' => $this->when(
                $this->relationLoaded('variants') || array_key_exists('variants_count', $this->getAttributes()),
                fn () => $this->relationLoaded('variants') ? $this->variants->isNotEmpty() : $this->variants_count > 0,
            ),
            'rating' => $this->when(
                array_key_exists('rating', $this->getAttributes()),
                fn () => $this->rating !== null ? round((float) $this->rating, 1) : null,
            ),
            'reviews_count' => $this->whenCounted('reviews_count', fn () => (int) $this->reviews_count),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            // Admin-only fields
            'status' => $this->when($isStaff, $this->status),
            'cost' => $this->when($isStaff, $this->cost),
            'low_stock_threshold' => $this->when($isStaff, $this->low_stock_threshold),
            'is_low_stock' => $this->when($isStaff, fn () => $this->isLowStock()),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->when($isStaff, fn () => $this->updated_at?->toIso8601String()),
        ];
    }
}
