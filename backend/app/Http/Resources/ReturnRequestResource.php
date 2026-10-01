<?php

namespace App\Http\Resources;

use App\Models\ReturnRequest;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReturnRequest */
class ReturnRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->whenLoaded('order', fn () => $this->order?->order_number),
            'order_id' => $this->order_id,
            'order_item_id' => $this->order_item_id,
            'item' => $this->whenLoaded('orderItem', fn () => $this->orderItem ? new OrderItemResource($this->orderItem) : null),
            'customer' => $this->whenLoaded('order', fn () => [
                'name' => $this->order?->name,
                'phone' => $this->order?->phone,
            ]),
            'reason' => $this->reason,
            'details' => $this->details,
            'resolution' => $this->resolution,
            'qty' => $this->qty,
            'amount' => $this->amount,
            'status' => $this->status,
            'photos' => Media::urls($this->photos),
            'admin_note' => $this->admin_note,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
