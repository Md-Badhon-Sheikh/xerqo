<?php

namespace App\Http\Resources;

use App\Models\Review;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Review */
class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isStaff = (bool) $request->user()?->isStaff();

        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'photos' => Media::urls($this->photos),
            'status' => $this->status,
            'delivery_rating' => $this->delivery_rating,
            'courier_rating' => $this->courier_rating,
            'packaging_rating' => $this->packaging_rating,
            'author' => $this->whenLoaded('user', fn () => [
                'name' => $this->user?->name,
            ]),
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
            ] : null),
            'order_number' => $this->whenLoaded('order', fn () => $this->order?->order_number),
            'customer' => $this->when($isStaff && $this->relationLoaded('user'), fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'phone' => $this->user?->phone,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
