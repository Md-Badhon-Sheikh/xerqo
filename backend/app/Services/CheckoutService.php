<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private CouponService $coupons,
        private SmsService $sms,
    ) {}

    /**
     * Delivery charge: Inside Dhaka 60, Outside Dhaka 120, free when the subtotal reaches the threshold (2000).
     * All three values are editable in the "delivery" setting.
     */
    public function deliveryCharge(string $zone, float $subtotal): float
    {
        $threshold = (float) Setting::getValue('delivery.free_delivery_threshold', 2000);

        if ($threshold > 0 && $subtotal >= $threshold) {
            return 0.0;
        }

        return $zone === Order::ZONE_INSIDE_DHAKA
            ? (float) Setting::getValue('delivery.inside_dhaka', 60)
            : (float) Setting::getValue('delivery.outside_dhaka', 120);
    }

    /**
     * Price a cart without touching stock (used for coupon checks / order summaries).
     *
     * @param  array<int, array{product_id:int, variant_id?:int|null, qty:int}>  $items
     */
    public function subtotal(array $items): float
    {
        $subtotal = 0.0;

        foreach ($items as $line) {
            $product = Product::active()->find($line['product_id']);
            if (! $product) {
                continue;
            }

            $variant = ! empty($line['variant_id'])
                ? $product->variants()->whereKey($line['variant_id'])->first()
                : null;

            $subtotal += ($variant?->price ?? $product->price) * (int) $line['qty'];
        }

        return $subtotal;
    }

    /**
     * Create an order for a guest or a logged-in customer.
     *
     * Runs in one DB transaction: product/variant rows are locked, stock is validated and
     * decremented, the coupon is re-validated and its usage counter incremented.
     *
     * @param  array<string, mixed>  $data  validated StoreOrderRequest data
     *
     * @throws ValidationException
     */
    public function placeOrder(array $data, ?User $user = null): Order
    {
        $order = DB::transaction(function () use ($data, $user) {
            $lines = [];
            $subtotal = 0.0;

            foreach (array_values($data['items']) as $index => $line) {
                $field = "items.{$index}";
                $qty = (int) $line['qty'];

                /** @var Product|null $product */
                $product = Product::query()->whereKey($line['product_id'])->lockForUpdate()->first();

                if (! $product || $product->status !== 'active') {
                    throw ValidationException::withMessages([
                        "{$field}.product_id" => 'This product is no longer available.',
                    ]);
                }

                $variant = null;
                if (empty($line['variant_id']) && $product->variants()->where('is_active', true)->exists()) {
                    throw ValidationException::withMessages([
                        "{$field}.variant_id" => "Please choose an option (colour/size) for {$product->name}.",
                    ]);
                }

                if (! empty($line['variant_id'])) {
                    /** @var ProductVariant|null $variant */
                    $variant = ProductVariant::query()
                        ->whereKey($line['variant_id'])
                        ->where('product_id', $product->id)
                        ->lockForUpdate()
                        ->first();

                    if (! $variant || ! $variant->is_active) {
                        throw ValidationException::withMessages([
                            "{$field}.variant_id" => "The selected option for {$product->name} is not available.",
                        ]);
                    }
                }

                $available = $variant ? min($variant->stock, $product->stock) : $product->stock;
                if ($available < $qty) {
                    throw ValidationException::withMessages([
                        "{$field}.qty" => $available > 0
                            ? "Only {$available} left in stock for {$product->name}."
                            : "{$product->name} is out of stock.",
                    ]);
                }

                $engraving = isset($line['engraving_text']) ? trim((string) $line['engraving_text']) : '';
                if ($engraving !== '' && ! $product->is_engravable) {
                    throw ValidationException::withMessages([
                        "{$field}.engraving_text" => "{$product->name} cannot be engraved.",
                    ]);
                }

                $price = $variant?->price ?? $product->price;
                $lineTotal = $price * $qty;
                $subtotal += $lineTotal;

                $product->decrement('stock', $qty);
                $variant?->decrement('stock', $qty);

                $lines[] = [
                    'product_id' => $product->id,
                    'variant_id' => $variant?->id,
                    'name' => $product->name,
                    'variant_name' => $variant?->name,
                    'sku' => $variant?->sku ?? $product->sku,
                    'image' => $product->primaryImage?->path,
                    'price' => $price,
                    'qty' => $qty,
                    'total' => $lineTotal,
                    'engraving_text' => $engraving !== '' ? $engraving : null,
                ];
            }

            $coupon = null;
            $discount = 0.0;
            if (! empty($data['coupon_code'])) {
                $coupon = $this->coupons->resolve($data['coupon_code'], $subtotal, lock: true);
                $discount = $coupon->discountFor($subtotal);
                $coupon->increment('used');
            }

            $deliveryCharge = $this->deliveryCharge($data['delivery_zone'], $subtotal);

            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $user?->id,
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? $user?->email,
                'district' => $data['district'],
                'area' => $data['area'] ?? null,
                'address_line' => $data['address_line'],
                'delivery_zone' => $data['delivery_zone'],
                'subtotal' => $subtotal,
                'delivery_charge' => $deliveryCharge,
                'discount' => $discount,
                'total' => max(0, $subtotal - $discount + $deliveryCharge),
                'payment_method' => $data['payment_method'],
                'payment_status' => 'pending',
                'transaction_id' => $data['transaction_id'] ?? null,
                'status' => 'pending',
                'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code,
                'note' => $data['note'] ?? null,
            ]);

            $order->items()->createMany($lines);

            $order->statusHistories()->create([
                'status' => 'pending',
                'note' => 'Order placed'.($user ? '' : ' (guest checkout)'),
                'changed_by' => $user?->id,
            ]);

            return $order;
        });

        $this->sms->sendTemplate($order->phone, 'order_placed', [
            'name' => $order->name,
            'order_id' => $order->order_number,
            'total' => number_format($order->total),
        ]);

        return $order->load(['items', 'statusHistories']);
    }

    /**
     * Human friendly order numbers like XQ-24817.
     */
    private function generateOrderNumber(): string
    {
        $digits = 5;

        for ($attempt = 0; $attempt < 20; $attempt++) {
            if ($attempt === 10) {
                $digits = 7; // the 5-digit space is getting crowded
            }

            $number = 'XQ-'.random_int(10 ** ($digits - 1), (10 ** $digits) - 1);

            if (! Order::where('order_number', $number)->exists()) {
                return $number;
            }
        }

        return 'XQ-'.now()->format('ymdHis').random_int(10, 99);
    }
}
