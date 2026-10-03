<?php

namespace App\Http\Resources;

use App\Models\Payment;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'method' => $this->method,
            'amount' => $this->amount,
            'transaction_id' => $this->transaction_id,
            'sender_number' => $this->sender_number,
            'proof' => Media::url($this->proof),
            'status' => $this->status,
            'admin_note' => $this->admin_note,
            'verified_by' => $this->whenLoaded('verifier', fn () => $this->verifier?->name),
            'verified_at' => $this->verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            // admin list: the order it belongs to
            'order' => $this->whenLoaded('order', fn () => [
                'order_number' => $this->order->order_number,
                'name' => $this->order->name,
                'phone' => $this->order->phone,
                'total' => $this->order->total,
                'status' => $this->order->status,
                'payment_status' => $this->order->payment_status,
                'created_at' => $this->order->created_at?->toIso8601String(),
            ]),
        ];
    }
}
