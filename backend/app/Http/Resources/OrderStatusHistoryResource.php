<?php

namespace App\Http\Resources;

use App\Models\OrderStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OrderStatusHistory */
class OrderStatusHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'note' => $this->note,
            'changed_by' => $this->whenLoaded('changedBy', fn () => $this->changedBy?->name),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
