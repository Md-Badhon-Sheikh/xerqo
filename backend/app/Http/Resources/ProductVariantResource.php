<?php

namespace App\Http\Resources;

use App\Models\ProductVariant;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductVariant */
class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Storefront: the price the customer pays (falls back to the product / flash-sale price).
        // Admin: the stored override, null meaning "same as product".
        $price = ! $request->is('api/admin/*') && $this->relationLoaded('product')
            ? $this->product->priceFor($this->resource)
            : $this->price;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'color_hex' => $this->color_hex,
            'image' => Media::url($this->image),
            'sku' => $this->sku,
            'price' => $price,
            'stock' => $this->stock,
            'in_stock' => $this->stock > 0,
            'is_active' => $this->is_active,
        ];
    }
}
