<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\SmsGateway;
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

            // Manual payments: the customer pays to these accounts and submits the transaction id / slip.
            'payments' => [[
                'cod' => ['enabled' => true, 'label' => 'Cash on Delivery'],
                'bkash' => ['enabled' => true, 'label' => 'bKash', 'number' => '01700000000', 'account_type' => 'Merchant', 'instructions' => 'Open bKash › Make Payment, enter the number below and the exact amount, then type the Transaction ID from the bKash SMS.'],
                'rocket' => ['enabled' => true, 'label' => 'Rocket', 'number' => '017000000001', 'account_type' => 'Personal', 'instructions' => 'Dial *322# or open the Rocket app › Send Money to the number below, then type the TxnId from the Rocket SMS.'],
                'nagad' => ['enabled' => true, 'label' => 'Nagad', 'number' => '01700000000', 'account_type' => 'Merchant', 'instructions' => 'Open Nagad › Merchant Pay, enter the number below and the exact amount, then type the TxnID from the Nagad SMS.'],
                'bank' => [
                    'enabled' => true, 'label' => 'Bank transfer / Card',
                    'bank_name' => 'Dutch-Bangla Bank PLC', 'account_name' => 'XERQO', 'account_number' => '1234567890123',
                    'branch' => 'Hazaribagh, Dhaka', 'routing_number' => '090260000',
                    'instructions' => 'Transfer or deposit the order total (you can pay from any bank account or card via internet banking), then upload the deposit slip or transfer receipt.',
                ],
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

            // customer sign-in options (public so the storefront knows which forms to show)
            'auth' => [[
                'otp_login' => true,      // "sign in with a code" by SMS
                'register_otp' => true,   // new accounts must confirm their phone by SMS
            ], 'general', true],

            // the strip above the storefront header
            'announcement' => [[
                'enabled' => true,
                'text' => 'Free delivery across Bangladesh on orders over Tk 2,000 · Cash on Delivery · bKash, Rocket & Nagad',
                'mobile_text' => 'Free delivery over Tk 2,000 · COD',
                'link_text' => 'Shop Now',
                'link' => '/shop',
            ], 'content', true],

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
                    'body' => 'Hi {name}, thanks for shopping at XERQO! Your order {order_id} (Tk {total}) has been received. We will call you to confirm.',
                ],
                'order_confirmed' => [
                    'name' => 'Order confirmed',
                    'enabled' => true,
                    'body' => 'Hi {name}, your XERQO order {order_id} (Tk {total}) is confirmed. We will call before dispatch. Thank you!',
                ],
                'order_processing' => [
                    'name' => 'Processing',
                    'enabled' => true,
                    'body' => 'Hi {name}, your XERQO order {order_id} is being prepared in our workshop. We will text you when it ships.',
                ],
                'payment_verified' => [
                    'name' => 'Payment verified',
                    'enabled' => true,
                    'body' => 'Hi {name}, we received your payment of Tk {amount} for order {order_id}. Thank you!',
                ],
                'payment_rejected' => [
                    'name' => 'Payment not verified',
                    'enabled' => true,
                    'body' => 'Hi {name}, we could not verify the payment for order {order_id}: {reason}. Please resend it: {tracking_link}',
                ],
                'order_shipped' => [
                    'name' => 'Shipped',
                    'enabled' => true,
                    'body' => '{name}, order {order_id} is on the way with {courier}. Track: {tracking_link}',
                ],
                'out_for_delivery' => [
                    'name' => 'Out for delivery',
                    'enabled' => true,
                    'body' => 'Your XERQO parcel {order_id} will arrive today. Please keep Tk {cod_amount} ready.',
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

            'email_notifications' => [[
                'customer_order' => true,
                'customer_status' => true,
                'admin_new_order' => true,
                'admin_email' => 'orders@xerqo.com',
            ], 'notifications', false],
        ];

        foreach ($settings as $key => [$value, $group, $isPublic]) {
            Setting::setValue($key, $value, $group, $isPublic);
        }

        // SMS wallet: a little demo balance locally; production starts at ৳0 until the Super Admin tops up
        $gateway = SmsGateway::current();
        if (! app()->isProduction() && $gateway->balance_paisa === 0) {
            $gateway->update(['balance_paisa' => 50000, 'sender_id' => $gateway->sender_id ?? 'XERQO']);
        }
    }
}
