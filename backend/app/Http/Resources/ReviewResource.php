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
        $isOwner = $request->user() && $request->user()->id === $this->user_id;

        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'tags' => $this->tags ?? [],
            'is_anonymous' => (bool) $this->is_anonymous,
            'photos' => Media::urls($this->photos),
            'status' => $this->status,
            'is_featured' => (bool) $this->is_featured,
            'reply' => $this->admin_reply,
            'replied_at' => $this->replied_at?->toIso8601String(),
            'delivery_rating' => $this->when($isStaff || $isOwner, $this->delivery_rating),
            'courier_rating' => $this->when($isStaff || $isOwner, $this->courier_rating),
            'packaging_rating' => $this->when($isStaff || $isOwner, $this->packaging_rating),
            'author' => $this->whenLoaded('user', fn () => [
                'name' => $isStaff || $isOwner ? $this->user?->name : $this->publicName(),
            ]),
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'image' => $this->product->relationLoaded('primaryImage') ? Media::url($this->product->primaryImage?->path) : null,
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
