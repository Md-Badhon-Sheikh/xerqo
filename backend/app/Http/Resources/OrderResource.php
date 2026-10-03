<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'user_id' => $this->user_id,
            'customer' => $this->whenLoaded('user', fn () => $this->user ? new UserResource($this->user) : null),
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'district' => $this->district,
            'area' => $this->area,
            'address_line' => $this->address_line,
            'delivery_zone' => $this->delivery_zone,
            'billing' => $this->billing_name ? [
                'name' => $this->billing_name,
                'phone' => $this->billing_phone,
                'address' => $this->billing_address,
            ] : null,
            'payment' => $this->whenLoaded('latestPayment', fn () => $this->latestPayment ? new PaymentResource($this->latestPayment) : null),
            'subtotal' => $this->subtotal,
            'delivery_charge' => $this->delivery_charge,
            'discount' => $this->discount,
            'total' => $this->total,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'transaction_id' => $this->transaction_id,
            'status' => $this->status,
            'courier' => $this->courier,
            'tracking_code' => $this->tracking_code,
            'coupon_code' => $this->coupon_code,
            'note' => $this->note,
            'items_count' => $this->whenCounted('items'),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'status_history' => OrderStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'return_requests' => ReturnRequestResource::collection($this->whenLoaded('returnRequests')),
            'reviewed_product_ids' => $this->whenLoaded('reviews', fn () => $this->reviews->pluck('product_id')->values()),
            'can_review' => $this->when(
                $this->relationLoaded('reviews') && $this->relationLoaded('items'),
                fn () => $this->isDelivered()
                    && $this->items->pluck('product_id')->filter()->diff($this->reviews->pluck('product_id'))->isNotEmpty(),
            ),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
