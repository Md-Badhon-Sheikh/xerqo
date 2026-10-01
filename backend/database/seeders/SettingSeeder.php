<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        // key => [value, group, is_public]
        $settings = [
            'store' => [[
                'name' => 'XERQO',
                'tagline' => 'Genuine leather, handcrafted in Bangladesh',
                'phone' => '+880 1700-000000',
                'whatsapp' => '+880 1700-000000',
                'email' => 'hello@xerqo.com',
                'address' => 'Hazaribagh, Dhaka 1209, Bangladesh',
                'facebook' => 'https://facebook.com/xerqo.bd',
                'instagram' => 'https://instagram.com/xerqo.bd',
                'currency' => 'BDT',
                'currency_symbol' => '৳',
            ], 'general', true],

            'delivery' => [[
                'inside_dhaka' => 60,
                'outside_dhaka' => 120,
                'free_delivery_threshold' => 2000,
                'inside_dhaka_eta' => '1–2 days',
                'outside_dhaka_eta' => '2–4 days',
                'couriers' => ['Steadfast', 'Pathao', 'RedX'],
            ], 'delivery', true],

            'payments' => [[
                'cod' => ['enabled' => true, 'label' => 'Cash on Delivery'],
                'bkash' => ['enabled' => true, 'label' => 'bKash', 'merchant_number' => '01700000000'],
                'nagad' => ['enabled' => true, 'label' => 'Nagad', 'merchant_number' => '01700000000'],
                'card' => ['enabled' => false, 'label' => 'Visa / Mastercard'],
            ], 'payments', true],

            'returns' => [[
                'window_days' => 7,
                'policy' => 'Unused items in original packaging can be returned or exchanged within 7 days of delivery. Engraved items can only be exchanged for manufacturing defects.',
            ], 'returns', true],

            'engraving' => [[
                'enabled' => true,
                'max_length' => 30,
                'fee' => 0,
            ], 'general', true],

            'reviews' => [[
                'auto_approve' => false,
                'review_request_delay_hours' => 2,
                'reward_points_photo_review' => 50,
            ], 'reviews', false],

            // Placeholders: {name} {order_id} {total} {courier} {tracking_link} {cod_amount} {product}
            //               {review_link} {return_id} {date} {cart_link} {otp} {minutes}
            'sms_templates' => [[
                'order_placed' => [
                    'name' => 'Order placed',
                    'enabled' => true,
                    'body' => 'Hi {name}, thanks for shopping at XERQO! Your order {order_id} (৳{total}) has been received. We will call you to confirm.',
                ],
                'order_confirmed' => [
                    'name' => 'Order confirmed',
                    'enabled' => true,
                    'body' => 'Hi {name}, your XERQO order {order_id} (৳{total}) is confirmed. We’ll call before dispatch. Thank you!',
                ],
                'order_shipped' => [
                    'name' => 'Shipped',
                    'enabled' => true,
                    'body' => '{name}, order {order_id} is on the way with {courier}. Track: {tracking_link}',
                ],
                'out_for_delivery' => [
                    'name' => 'Out for delivery',
                    'enabled' => true,
                    'body' => 'Your XERQO parcel {order_id} will arrive today. Please keep ৳{cod_amount} ready.',
                ],
                'order_delivered_review' => [
                    'name' => 'Delivered + review request',
                    'enabled' => true,
                    'body' => 'Delivered! Loved your {product}? Rate it in 10 sec & get 50 reward points: {review_link}',
                    'delay' => 'Sent 2 hours after courier marks the parcel delivered',
                ],
                'order_cancelled' => [
                    'name' => 'Order cancelled',
                    'enabled' => true,
                    'body' => 'Hi {name}, your XERQO order {order_id} has been cancelled. Questions? Call us anytime.',
                ],
                'return_approved' => [
                    'name' => 'Return approved',
                    'enabled' => true,
                    'body' => 'Return {return_id} approved. Rider will pick up on {date}.',
                ],
                'abandoned_cart' => [
                    'name' => 'Abandoned cart',
                    'enabled' => false,
                    'body' => '{name}, your items are waiting. Complete order: {cart_link}',
                ],
                'password_otp' => [
                    'name' => 'Password reset OTP',
                    'enabled' => true,
                    'body' => 'Your XERQO password reset code is {otp}. It expires in {minutes} minutes. Do not share it with anyone.',
                ],
            ], 'sms', false],
        ];

        foreach ($settings as $key => [$value, $group, $isPublic]) {
            Setting::setValue($key, $value, $group, $isPublic);
        }
    }
}
