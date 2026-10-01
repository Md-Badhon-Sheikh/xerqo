<?php

namespace App\Http\Resources;

use App\Models\ProductImage;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProductImage */
class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => Media::url($this->path),
            'alt' => $this->alt,
            'sort_order' => $this->sort_order,
        ];
    }
}
