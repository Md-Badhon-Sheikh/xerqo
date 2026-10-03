<?php

namespace App\Http\Resources;

use App\Models\FlashSale;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FlashSale */
class FlashSaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'is_active' => $this->is_active,
            'is_live' => $this->isLive(),
            'items_count' => $this->whenCounted('items'),
            // storefront: the sale's products (already priced at the sale price)
            'products' => ProductResource::collection($this->whenLoaded('products')),
        ];
    }
}
