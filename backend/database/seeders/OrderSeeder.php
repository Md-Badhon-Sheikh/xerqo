<?php

namespace Database\Seeders;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo orders (based on frontend/src/data/admin.js + store.js), with status history,
 * reviews (only on delivered orders) and return requests.
 * Stock is not decremented for demo data.
 */
class OrderSeeder extends Seeder
{
    /** Status path an order walks through to reach its final status. */
    private const PATHS = [
        'pending' => ['pending'],
        'confirmed' => ['pending', 'confirmed'],
        'packed' => ['pending', 'confirmed', 'packed'],
        'shipped' => ['pending', 'confirmed', 'packed', 'shipped'],
        'delivered' => ['pending', 'confirmed', 'packed', 'shipped', 'delivered'],
        'cancelled' => ['pending', 'cancelled'],
        'returned' => ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'returned'],
    ];

    public function run(): void
    {
        $orders = [
            // Rahim Uddin (demo customer rahim@example.com)
            ['XQ-24817', 'rahim@example.com', null, 'pending', 'cod', null, 1, [['Classic Bifold Wallet', 1, 'Burgundy Croc'], ['Custom Name Passport Cover', 1, 'Black', 'M. HOSSAIN']]],
            ['XQ-23102', 'rahim@example.com', null, 'delivered', 'cod', 'Steadfast', 20, [['Classic Bifold Wallet', 1, 'Black']]],
            ['XQ-21877', 'rahim@example.com', null, 'delivered', 'bkash', 'Pathao', 43, [['Voyager Passport Cover', 1], ['Key Holder — Red', 1]]],
            // Admin panel demo orders
            ['XQ-24816', 'nusrat@example.com', null, 'confirmed', 'bkash', 'Pathao', 2, [['Voyager Passport Cover', 1], ['Zip-Around Long Wallet', 1]]],
            ['XQ-24815', 'tanvir@example.com', null, 'packed', 'nagad', 'Steadfast', 2, [['Heritage Long Wallet', 1, 'Coffee']]],
            ['XQ-24812', 'farzana@example.com', null, 'shipped', 'cod', 'Pathao', 3, [['Rose Clasp Purse', 1], ['Snap Card Purse', 1], ['Key Holder — Red', 1]]],
            ['XQ-24809', 'imran@example.com', null, 'delivered', 'card', 'RedX', 4, [['Everyday Tote Bag', 1]], 'XERQO500'],
            ['XQ-24802', null, ['Sabbir Rahman', '01799345678', 'Rajshahi', 'Shaheb Bazar', '21 Shaheb Bazar Road'], 'delivered', 'cod', 'Steadfast', 5, [['Zip-Around Long Wallet', 1]]],
            ['XQ-24798', 'mitu@example.com', null, 'cancelled', 'bkash', null, 6, [['Key Holder — Red', 2], ['Grey Loop Key Holder', 1], ['Floral Key Tag', 1]]],
            ['XQ-24790', null, ['Karim Sheikh', '01933345678', 'Cumilla', 'Kandirpar', '5 Kandirpar Circle'], 'returned', 'cod', 'Pathao', 7, [['Heritage Long Wallet', 1, 'Black']]],
            // Older delivered orders that carry the storefront testimonials
            ['XQ-20511', 'tanvir@example.com', null, 'delivered', 'cod', 'Steadfast', 190, [['Classic Bifold Wallet', 1, 'Tan']]],
            ['XQ-20644', 'nusrat@example.com', null, 'delivered', 'bkash', 'Pathao', 120, [['Heritage Long Wallet', 1, 'Coffee', 'S. RAHMAN']]],
            ['XQ-20390', 'rafiul@example.com', null, 'delivered', 'cod', 'Steadfast', 60, [['Classic Bifold Wallet', 1, 'Black']]],
        ];

        foreach ($orders as $row) {
            $this->createOrder(...$row);
        }

        $this->seedReviews();
        $this->seedReturns();
    }

    /**
     * @param  array<int, array{0:string, 1:int, 2?:string, 3?:string}>  $items  [product name, qty, variant name, engraving]
     * @param  array{0:string,1:string,2:string,3:string,4:string}|null  $guest  [name, phone, district, area, address]
     */
    private function createOrder(
        string $number,
        ?string $email,
        ?array $guest,
        string $status,
        string $payment,
        ?string $courier,
        int $daysAgo,
        array $items,
        ?string $couponCode = null,
    ): void {
        if (Order::where('order_number', $number)->exists()) {
            return;
        }

        $user = $email ? User::with('addresses')->where('email', $email)->first() : null;
        $address = $user?->addresses->first();

        [$name, $phone, $district, $area, $line] = $guest ?? [
            $user->name, $user->phone, $address->district, $address->area, $address->address_line,
        ];

        $lines = [];
        $subtotal = 0;

        foreach ($items as $item) {
            [$productName, $qty] = $item;
            $product = Product::with(['variants', 'primaryImage'])->where('name', $productName)->firstOrFail();
            $variant = isset($item[2]) ? $product->variants->firstWhere('name', $item[2]) : null;
            $price = $variant?->price ?? $product->price;
            $subtotal += $price * $qty;

            $lines[] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'name' => $product->name,
                'variant_name' => $variant?->name ?? ($item[2] ?? null),
                'sku' => $variant?->sku ?? $product->sku,
                'image' => $product->primaryImage?->path,
                'price' => $price,
                'qty' => $qty,
                'total' => $price * $qty,
                'engraving_text' => $item[3] ?? null,
            ];
        }

        $zone = strcasecmp($district, 'Dhaka') === 0 ? Order::ZONE_INSIDE_DHAKA : Order::ZONE_OUTSIDE_DHAKA;
        $delivery = $subtotal >= 2000 ? 0 : ($zone === Order::ZONE_INSIDE_DHAKA ? 60 : 120);

        $coupon = $couponCode ? Coupon::where('code', $couponCode)->first() : null;
        $discount = $coupon ? $coupon->discountFor($subtotal) : 0;
        $coupon?->increment('used');

        $createdAt = now()->subDays($daysAgo)->setTime(10 + ($daysAgo % 9), ($daysAgo * 7) % 60);
        $path = self::PATHS[$status];
        $deliveredAt = in_array('delivered', $path, true) ? $createdAt->copy()->addDays(2)->addHours(5) : null;

        $order = Order::create([
            'order_number' => $number,
            'user_id' => $user?->id,
            'name' => $name,
            'phone' => $phone,
            'email' => $user?->email,
            'district' => $district,
            'area' => $area,
            'address_line' => $line,
            'delivery_zone' => $zone,
            'subtotal' => $subtotal,
            'delivery_charge' => $delivery,
            'discount' => $discount,
            'total' => $subtotal - $discount + $delivery,
            'payment_method' => $payment,
            'payment_status' => match (true) {
                $status === 'returned' => 'refunded',
                $status === 'cancelled' => $payment === 'cod' ? 'pending' : 'refunded',
                $payment !== 'cod', $status === 'delivered' => 'paid',
                default => 'pending',
            },
            'transaction_id' => $payment === 'cod' ? null : strtoupper(substr(md5($number), 0, 10)),
            'status' => $status,
            'courier' => $courier,
            'tracking_code' => $courier && in_array('shipped', $path, true) ? strtoupper(substr($courier, 0, 3)).'-'.substr(preg_replace('/\D/', '', $number), -5).'BD' : null,
            'coupon_id' => $coupon?->id,
            'coupon_code' => $coupon?->code,
            'delivered_at' => $deliveredAt,
        ]);

        $order->items()->createMany($lines);

        $notes = [
            'pending' => 'Order placed',
            'confirmed' => 'Confirmed by phone call',
            'packed' => 'Packed and ready for pickup',
            'shipped' => $courier ? "Handed over to {$courier}" : 'Shipped',
            'delivered' => 'Delivered to customer',
            'cancelled' => 'Customer cancelled on confirmation call',
            'returned' => 'Parcel returned to warehouse',
        ];

        $lastAt = $createdAt;

        foreach ($path as $step => $stepStatus) {
            $at = match ($stepStatus) {
                'delivered' => $deliveredAt,
                'returned' => $deliveredAt->copy()->addDays(2),
                default => $createdAt->copy()->addHours($step * 9),
            };

            $history = $order->statusHistories()->create(['status' => $stepStatus, 'note' => $notes[$stepStatus]]);
            $history->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
            $lastAt = $at;
        }

        $order->forceFill(['created_at' => $createdAt, 'updated_at' => $lastAt])->save();
    }

    private function seedReviews(): void
    {
        $reviews = [
            // [order, product, rating, title, body, status, delivery, courier, packaging]
            ['XQ-20511', 'Classic Bifold Wallet', 5, 'Better than day one', 'The stitching is so neat and the leather smells real. After 6 months my wallet looks better than day one.', Review::STATUS_APPROVED, 5, 5, 5],
            ['XQ-20644', 'Heritage Long Wallet', 5, 'Perfect gift', 'Ordered a long wallet with my husband’s name engraved. Arrived in 2 days in a beautiful box!', Review::STATUS_APPROVED, 5, 4, 5],
            ['XQ-20390', 'Classic Bifold Wallet', 5, 'Easy to trust', 'Cash on delivery made it easy to trust. Quality is better than imported brands at double the price.', Review::STATUS_APPROVED, 5, 5, 4],
            ['XQ-21877', 'Voyager Passport Cover', 4, 'Solid passport cover', 'Fits my passport and boarding pass perfectly. Leather is thick and well finished.', Review::STATUS_APPROVED, 4, 4, 5],
            ['XQ-24809', 'Everyday Tote Bag', 5, 'Beautiful tote', 'Absolutely beautiful bag — the colour is richer in person and the stitching feels solid. Packaging was premium too.', Review::STATUS_PENDING, 5, 4, 5],
        ];

        foreach ($reviews as [$number, $productName, $rating, $title, $body, $status, $delivery, $courier, $packaging]) {
            $order = Order::where('order_number', $number)->first();
            $product = Product::where('name', $productName)->first();

            if (! $order || ! $product || ! $order->user_id || ! $order->isDelivered()) {
                continue;
            }

            Review::updateOrCreate(
                ['user_id' => $order->user_id, 'product_id' => $product->id, 'order_id' => $order->id],
                [
                    'rating' => $rating,
                    'title' => $title,
                    'body' => $body,
                    'status' => $status,
                    'delivery_rating' => $delivery,
                    'courier_rating' => $courier,
                    'packaging_rating' => $packaging,
                ],
            );
        }
    }

    private function seedReturns(): void
    {
        // Karim's returned parcel: refund completed.
        $karim = Order::where('order_number', 'XQ-24790')->with('items')->first();
        if ($karim && $item = $karim->items->first()) {
            ReturnRequest::firstOrCreate(['order_item_id' => $item->id], [
                'order_id' => $karim->id,
                'user_id' => null,
                'reason' => 'Changed my mind',
                'details' => 'Customer refused the parcel at delivery.',
                'resolution' => 'refund',
                'qty' => $item->qty,
                'amount' => $item->total,
                'status' => 'completed',
                'admin_note' => 'Parcel back in stock; refunded via bKash.',
                'resolved_at' => now()->subDays(3),
            ]);
        }

        // Imran's tote: pending exchange request.
        $imran = Order::where('order_number', 'XQ-24809')->with('items')->first();
        if ($imran && $item = $imran->items->first()) {
            ReturnRequest::firstOrCreate(['order_item_id' => $item->id], [
                'order_id' => $imran->id,
                'user_id' => $imran->user_id,
                'reason' => 'Colour differs from photo',
                'details' => 'Would like to exchange for the darker shade.',
                'resolution' => 'exchange',
                'qty' => 1,
                'amount' => 0,
                'status' => 'pending',
            ]);
        }
    }
}
