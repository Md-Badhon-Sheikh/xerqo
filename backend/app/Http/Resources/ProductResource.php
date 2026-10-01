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
        $image = $this->relationLoaded('primaryImage')
            ? $this->primaryImage?->path
            : ($this->relationLoaded('images') ? $this->images->first()?->path : null);

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
            'description' => $this->description,
            'price' => $this->price,
            'compare_price' => $this->compare_price,
            'discount_percent' => $this->discountPercent(),
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'is_engravable' => $this->is_engravable,
            'badge' => $this->badge,
            'image' => Media::url($image),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
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
