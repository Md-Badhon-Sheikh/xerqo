<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        $coupons = [
            ['code' => 'XERQO500', 'description' => '৳500 off orders over ৳3,000', 'type' => 'fixed', 'value' => 500, 'min_order' => 3000, 'max_discount' => null, 'max_uses' => 500, 'starts_at' => now()->subMonth(), 'ends_at' => now()->addMonths(3), 'is_active' => true],
            ['code' => 'WELCOME10', 'description' => '10% off your first order (max ৳300)', 'type' => 'percent', 'value' => 10, 'min_order' => 1000, 'max_discount' => 300, 'max_uses' => null, 'starts_at' => null, 'ends_at' => null, 'is_active' => true],
            ['code' => 'EID15', 'description' => 'Eid special: 15% off (max ৳1,000)', 'type' => 'percent', 'value' => 15, 'min_order' => 2000, 'max_discount' => 1000, 'max_uses' => 300, 'starts_at' => now()->subMonths(4), 'ends_at' => now()->subMonths(3), 'is_active' => true],
            ['code' => 'FREEGIFT', 'description' => '৳200 off — paused', 'type' => 'fixed', 'value' => 200, 'min_order' => 1500, 'max_discount' => null, 'max_uses' => 100, 'starts_at' => null, 'ends_at' => null, 'is_active' => false],
        ];

        foreach ($coupons as $coupon) {
            Coupon::updateOrCreate(['code' => $coupon['code']], $coupon);
        }
    }
}
