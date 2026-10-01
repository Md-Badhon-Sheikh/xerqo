<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    public function __construct(private SmsService $sms) {}

    /**
     * Move an order to a new status, write the status history, and apply side effects:
     * - cancelled / returned: put stock back (and release the coupon use on cancel)
     * - delivered: stamp delivered_at, mark COD orders paid, SMS a review request
     *
     * @throws ValidationException
     */
    public function transition(Order $order, string $status, ?string $note = null, ?User $by = null): Order
    {
        if ($order->status === $status) {
            throw ValidationException::withMessages(['status' => "The order is already {$status}."]);
        }

        if (! $order->canTransitionTo($status)) {
            throw ValidationException::withMessages([
                'status' => "Cannot change order status from {$order->status} to {$status}.",
            ]);
        }

        DB::transaction(function () use ($order, $status, $note, $by) {
            $attributes = ['status' => $status];

            if ($status === 'delivered') {
                $attributes['delivered_at'] = now();

                if ($order->payment_method === 'cod') {
                    $attributes['payment_status'] = 'paid';
                }
            }

            if (in_array($status, ['cancelled', 'returned'], true)) {
                $this->restock($order);
            }

            if ($status === 'cancelled' && $order->coupon_id) {
                Coupon::whereKey($order->coupon_id)->where('used', '>', 0)->decrement('used');
            }

            $order->update($attributes);

            $order->statusHistories()->create([
                'status' => $status,
                'note' => $note,
                'changed_by' => $by?->id,
            ]);
        });

        $this->notify($order, $status);

        return $order->refresh();
    }

    private function restock(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->variant_id) {
                ProductVariant::whereKey($item->variant_id)->increment('stock', $item->qty);
            }

            if ($item->product_id) {
                Product::whereKey($item->product_id)->increment('stock', $item->qty);
            }
        }
    }

    private function notify(Order $order, string $status): void
    {
        $template = match ($status) {
            'confirmed' => 'order_confirmed',
            'shipped' => 'order_shipped',
            'delivered' => 'order_delivered_review',
            'cancelled' => 'order_cancelled',
            default => null,
        };

        if ($template === null) {
            return;
        }

        $frontend = rtrim((string) config('app.frontend_url'), '/');
        $order->loadMissing('items');

        $this->sms->sendTemplate($order->phone, $template, [
            'name' => $order->name,
            'order_id' => $order->order_number,
            'total' => number_format($order->total),
            'cod_amount' => $order->payment_status === 'paid' ? '0' : number_format($order->total),
            'courier' => $order->courier ?? 'our courier',
            'tracking_link' => $frontend.'/track?order='.$order->order_number,
            'product' => $order->items->first()?->name ?? 'your order',
            'review_link' => $frontend.'/account/review/'.$order->order_number,
        ]);
    }
}
