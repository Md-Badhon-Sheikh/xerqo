<?php

namespace App\Http\Resources;

use App\Models\OrderItem;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OrderItem */
class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_id' => $this->variant_id,
            'product_slug' => $this->whenLoaded('product', fn () => $this->product?->slug),
            'name' => $this->name,
            'variant_name' => $this->variant_name,
            'sku' => $this->sku,
            'image' => Media::url($this->image),
            'price' => $this->price,
            'qty' => $this->qty,
            'total' => $this->total,
            'engraving_text' => $this->engraving_text,
        ];
    }
}
