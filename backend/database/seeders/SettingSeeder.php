<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\SmsGateway;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * key => [value, group, is_public]
     *
     * @return array<string, array{0: mixed, 1: string, 2: bool}>
     */
    public static function defaults(): array
    {
        return [
            'store' => [[
                'name' => 'XERQO',
                'tagline' => 'Genuine leather, handcrafted in Bangladesh',
                'phone' => '+880 1700-000000',
                'whatsapp' => '+880 1700-000000',
                'email' => 'hello@xerqo.com',
                'address' => 'Hazaribagh, Dhaka 1209, Bangladesh',
                'facebook' => 'https://facebook.com/xerqo.bd',
                'instagram' => 'https://instagram.com/xerqo.bd',
                'messenger' => 'https://m.me/xerqo.bd',
                'show_chat_button' => true,
                'trade_license' => null,
                'bin' => null,
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

            // the numbered strip under "Featured categories" on the homepage
            // "What our customers say" on the homepage — built from approved product reviews
            // "The XERQO way" section on the homepage (Admin › Content & banners)
            'craft_story' => [[
                'enabled' => true,
                'eyebrow' => 'The XERQO way',
                'title' => 'Cut, stitched and burnished by hand — in Dhaka.',
                'highlight' => 'hand',
                'text' => 'Every piece starts as a hide selected for grain and thickness. Our artisans cut each panel by hand, saddle-stitch it with waxed thread and burnish the edges — so it only gets better with age.',
                'stats' => [
                    ['value' => 'Full-grain', 'label' => 'Leather only'],
                    ['value' => '1,200+', 'label' => 'Stitches / wallet'],
                    ['value' => '1 Year', 'label' => 'Warranty'],
                ],
                'button_text' => 'Read our story',
                'link' => '/about',
                'image' => '/images/tools-hand.jpg',
                'image_small' => '/images/spools.jpg',
            ], 'content', true],

            'testimonials' => [[
                'enabled' => true,
                'eyebrow' => 'Verified buyers',
                'title' => 'What our customers say',
                'count' => 3,
                'source' => 'auto',   // auto = featured first, then the latest; featured = only reviews marked "Featured"
                'min_rating' => 4,
            ], 'content', true],

            'highlights' => [[
                'enabled' => true,
                'items' => [
                    ['title' => '100% Genuine Leather', 'subtitle' => 'Full-grain & top-grain'],
                    ['title' => 'Hand-stitched', 'subtitle' => 'Built to last'],
                    ['title' => 'Cash on Delivery', 'subtitle' => 'Plus bKash, Rocket & Nagad'],
                    ['title' => '7-Day Easy Return', 'subtitle' => 'Free exchange'],
                ],
            ], 'content', true],

            // Admin → Pages (images are "/images/…" from the React build or "/storage/content/…" uploads)
            'about' => [[
                'hero' => [
                    'eyebrow' => 'Our story',
                    'title' => 'Crafted for class. Made to last.',
                    'text' => 'XERQO started in Dhaka with one idea — everyday leather goods that feel premium, age beautifully and are priced honestly for Bangladesh.',
                    'image' => '/images/tools-hand.jpg',
                ],
                'values' => [
                    ['title' => 'Premium Leather', 'subtitle' => 'Genuine cow & crocodile-embossed hides'],
                    ['title' => 'Expertly Crafted', 'subtitle' => 'Hand-cut, saddle-stitched, burnished'],
                    ['title' => 'Built for Durability', 'subtitle' => '1-year stitching warranty'],
                    ['title' => 'Timeless Design', 'subtitle' => 'Minimal shapes that never date'],
                ],
                'story' => [
                    ['title' => 'From hide to heirloom', 'text' => 'Every XERQO piece begins with a hide chosen for grain and thickness. We cut each panel by hand, saddle-stitch with waxed thread, and burnish the edges until they shine.', 'image' => '/images/workshop.jpg'],
                    ['title' => 'Leather that tells your story', 'text' => 'Full-grain leather darkens and softens with use. Scratches become character. That’s why we say our products get better with age — just like you.', 'image' => '/images/leather-close.jpg'],
                    ['title' => 'Personal by design', 'text' => 'Free name engraving on wallets, passport covers and key holders — because a gift should feel like it was made for one person.', 'image' => '/images/fb-passport-hand.jpg'],
                ],
                'stats' => [
                    ['value' => '12,000+', 'label' => 'Happy customers'],
                    ['value' => '64', 'label' => 'Districts delivered'],
                    ['value' => '4.9 ★', 'label' => 'Average rating'],
                    ['value' => '2025', 'label' => 'Founded in Dhaka'],
                ],
                'cta' => ['enabled' => true, 'title' => 'Carry something that lasts.', 'button_text' => 'Shop the collection', 'link' => '/shop', 'image' => '/images/cover.jpg'],
            ], 'content', true],

            // phone, WhatsApp, email and Facebook come from "store"
            'contact_page' => [[
                'hero' => [
                    'title' => 'We’re here to help',
                    'subtitle' => 'Questions about an order, custom engraving or corporate gifting? Reach us any way you like.',
                    'image' => '/images/keys-flower.jpg',
                ],
                'hours' => 'Sat–Thu · 10am–8pm',
                'whatsapp_note' => 'Replies in ~5 min',
                'email_note' => 'Reply within 24h',
                'showroom' => ['enabled' => true, 'area' => 'Dhanmondi, Dhaka', 'note' => 'By appointment', 'map_link' => 'https://maps.google.com/?q=Dhanmondi+Dhaka'],
                'subjects' => ['Order support', 'Custom engraving', 'Corporate gifting', 'Returns & exchange', 'Other'],
                'promo' => [
                    'enabled' => true,
                    'eyebrow' => 'Corporate gifting',
                    'text' => 'Branded wallets & passport covers for your team — logo debossing from 25 pcs.',
                    'button_text' => 'Request a quote',
                    'link' => '/contact',
                    'image' => '/images/briefcase.jpg',
                ],
            ], 'content', true],

            'footer' => [[
                'about' => 'Genuine leather wallets, bags and travel goods — crafted for class, made to last.',
                'newsletter' => ['enabled' => true, 'title' => 'Join the XERQO circle', 'text' => 'New drops, care tips and member-only offers.'],
                'columns' => [
                    ['title' => 'Shop', 'links' => [
                        ['label' => 'Wallets', 'link' => '/shop?c=wallets'],
                        ['label' => 'Long Wallets', 'link' => '/shop?c=long-wallets'],
                        ['label' => 'Card Holders', 'link' => '/shop?c=card-holders'],
                        ['label' => 'Passport Covers', 'link' => '/shop?c=passport-covers'],
                        ['label' => 'Key Holders', 'link' => '/shop?c=key-holders'],
                        ['label' => "Women's Purses", 'link' => '/shop?c=womens-purses'],
                        ['label' => 'Bags', 'link' => '/shop?c=bags'],
                        ['label' => 'Belts', 'link' => '/shop?c=belts'],
                    ]],
                    ['title' => 'Help', 'links' => [
                        ['label' => 'Track Order', 'link' => '/track'],
                        ['label' => 'Shipping & Delivery', 'link' => '/policy'],
                        ['label' => 'Returns & Exchange', 'link' => '/policy'],
                        ['label' => 'FAQs', 'link' => '/faq'],
                        ['label' => 'Contact Us', 'link' => '/contact'],
                    ]],
                    ['title' => 'Company', 'links' => [
                        ['label' => 'Our Story', 'link' => '/about'],
                        ['label' => 'Corporate Gifting', 'link' => '/contact'],
                        ['label' => 'Wholesale', 'link' => '/contact'],
                        ['label' => 'Privacy Policy', 'link' => '/policy'],
                        ['label' => 'Terms', 'link' => '/policy'],
                    ]],
                ],
                'copyright' => '© {year} XERQO. All rights reserved.',
            ], 'content', true],

            'reviews' => [[
                'auto_approve' => false, // true = reviews go live without moderation
            ], 'reviews', false],

            'seo' => [[
                'meta_title' => 'XERQO — Premium Leather Wallets, Bags & Accessories in Bangladesh',
                'meta_description' => 'Handcrafted genuine leather wallets, long wallets, passport covers, key holders and bags. Cash on delivery all over Bangladesh.',
            ], 'general', true],

            // "We'll be back soon" page for visitors; staff signed in to the admin still see the shop
            'maintenance' => [[
                'enabled' => false,
                'message' => 'We are polishing a few things and will be back very soon. For orders, call or WhatsApp us.',
            ], 'general', true],

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
                    'body' => 'Delivered! Loved your {product}? Rate it in 10 sec: {review_link}',
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
    }

    public function run(): void
    {
        $settings = self::defaults();

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
