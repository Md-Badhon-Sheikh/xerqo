<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

/**
 * The store's own pages (Admin → Pages): policies, FAQ, corporate gifting, wholesale.
 * Text taken from the old hard-coded /policy and /faq pages.
 */
class PageSeeder extends Seeder
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function defaults(): array
    {
        $sections = fn (array $rows) => implode("\n", array_map(fn ($r) => '<h2>'.e($r[0]).'</h2><p>'.e($r[1]).'</p>', $rows));

        return [
            ['slug' => 'shipping-delivery', 'title' => 'Shipping & Delivery Policy', 'content' => $sections([
                ['Delivery times', 'Inside Dhaka: 1–2 working days. Outside Dhaka: 2–4 working days. Engraved and personalised items need one extra day.'],
                ['Delivery charges', 'Inside Dhaka ৳60, outside Dhaka ৳120. Orders above ৳2,000 ship free anywhere in Bangladesh.'],
                ['Courier partners', 'We ship with Steadfast and Pathao. You’ll get an SMS with the tracking ID as soon as your parcel is handed over.'],
                ['Cash on Delivery', 'COD is available in all 64 districts. You may check the item in front of the rider before paying.'],
                ['Failed delivery', 'If we can’t reach you, the rider will try again the next working day. Parcels are held for up to 3 days.'],
            ])],
            ['slug' => 'returns-exchange', 'title' => 'Returns & Exchange Policy', 'content' => $sections([
                ['Eligibility', 'Items can be returned within 7 days of delivery if unused, with tags and original box. Engraved / personalised items can only be returned if faulty.'],
                ['How to request a return', 'Go to My Account → Orders → Request return, or WhatsApp us your order ID with photos. We confirm within 24 hours.'],
                ['Pickup & inspection', 'Our courier picks up the item (free inside Dhaka, ৳60 outside Dhaka). We inspect it within 2 working days.'],
                ['Refunds', 'Approved refunds go to your bKash / Nagad / bank within 3–5 working days. COD orders are refunded via bKash.'],
                ['Damaged or wrong item', 'Tell us within 48 hours with an unboxing photo/video — we replace it free.'],
            ])],
            ['slug' => 'privacy-policy', 'title' => 'Privacy Policy', 'content' => $sections([
                ['What we collect', 'Your name, phone number, delivery address and, optionally, email — only what we need to deliver your order.'],
                ['How we use it', 'To confirm and deliver orders, send order updates, and — if you opt in — share offers and new arrivals.'],
                ['Payments', 'bKash, Nagad and Rocket payments are made in your own wallet app. We never see or store your PIN or card details.'],
                ['Sharing', 'We share your address and phone only with our courier partners for delivery. We never sell your data.'],
                ['Your choices', 'You can update your details or turn off SMS offers from My Account → Profile.'],
            ])],
            ['slug' => 'terms-conditions', 'title' => 'Terms & Conditions', 'content' => $sections([
                ['Using this site', 'By placing an order you confirm the details you provide are accurate and that you are authorised to use the chosen payment method.'],
                ['Pricing & availability', 'Prices are in Bangladeshi Taka. We may cancel an order if an item is out of stock or mispriced, with a full refund.'],
                ['Order confirmation', 'Every order is confirmed by a phone call. Unconfirmed COD orders may be cancelled after 24 hours.'],
                ['Personalisation', 'Please double-check engraving text — we engrave exactly what you enter.'],
                ['Governing law', 'These terms are governed by the laws of Bangladesh. Disputes fall under the courts of Dhaka.'],
            ])],
            ['slug' => 'warranty', 'title' => 'Warranty', 'content' => $sections([
                ['What’s covered', 'Stitching, zips, snaps and edge finishing are covered for 12 months from delivery.'],
                ['What’s not covered', 'Normal wear, scratches, patina, water damage and misuse are not covered — they’re part of leather’s character.'],
                ['How to claim', 'WhatsApp us your order ID and a photo of the issue. We’ll arrange pickup and repair or replace the item free.'],
            ])],
            ['slug' => 'faq', 'title' => 'Frequently Asked Questions', 'type' => Page::TYPE_FAQ, 'faqs' => self::faqs()],
            ['slug' => 'corporate-gifting', 'title' => 'Corporate Gifting', 'content' => $sections([
                ['Gifts your team will actually use', 'Branded wallets, card holders, passport covers and key holders in genuine leather — a gift that lasts for years.'],
                ['Your logo, debossed', 'We deboss your company logo or each person’s name. Logo orders start from 25 pieces.'],
                ['How it works', 'Tell us the products, quantity and delivery date. We send a sample photo for approval, then deliver to your office anywhere in Bangladesh.'],
                ['Get a quote', 'Call or WhatsApp us, or send a message from the Contact page with “Corporate gifting” as the subject.'],
            ])],
            ['slug' => 'wholesale', 'title' => 'Wholesale', 'content' => $sections([
                ['Stock XERQO in your shop', 'We supply genuine leather wallets, bags and accessories to retailers across Bangladesh.'],
                ['Pricing', 'Wholesale prices depend on the products and quantity. Minimum order quantities apply.'],
                ['Get in touch', 'Call or WhatsApp us, or send a message from the Contact page with “Wholesale” in the message, and we’ll share the catalogue and prices.'],
            ])],
        ];
    }

    /**
     * @return array<int, array{group: string, question: string, answer: string}>
     */
    private static function faqs(): array
    {
        $groups = [
            'Orders & Payment' => [
                ['How do I place an order?', 'Add items to your cart, tap Checkout and enter your name, phone and address. We confirm every order by phone.'],
                ['Which payment methods do you accept?', 'Cash on Delivery, bKash, Nagad, Rocket and bank transfer.'],
                ['Can I cancel my order?', 'You can cancel any time before it is handed to the courier. Call or WhatsApp us with your order ID.'],
                ['Do you offer discounts on bulk orders?', 'Yes — orders of 25+ pieces get corporate pricing. Contact us for a quote.'],
                ['Will I get an invoice?', 'An invoice is available in My Account → Orders.'],
            ],
            'Delivery' => [
                ['How long does delivery take?', 'Inside Dhaka: 1–2 working days. Outside Dhaka: 2–4 working days via Steadfast / Pathao. Engraved items need +1 day.'],
                ['What are the delivery charges?', 'Inside Dhaka ৳60, outside Dhaka ৳120. Orders above ৳2,000 ship free.'],
                ['Do you deliver to all 64 districts?', 'Yes, we deliver to every district in Bangladesh through our courier partners.'],
                ['Can I pay cash on delivery?', 'Yes, COD is available everywhere. You can check the item before paying the rider.'],
                ['How do I track my order?', 'Use the Track Order page with your order ID and phone number, or open My Account → Orders.'],
                ['Can I change my address after ordering?', 'Yes, as long as the order hasn’t shipped. Message us on WhatsApp with the new address.'],
                ['Do you ship internationally?', 'Not yet — we currently ship within Bangladesh only.'],
            ],
            'Returns & Exchange' => [
                ['What is your return policy?', 'Unused items with tags and box can be returned within 7 days of delivery.'],
                ['Can I exchange for another colour?', 'Yes, colour exchange is free within 7 days.'],
                ['How long do refunds take?', 'Refunds reach your bKash / Nagad / bank within 3–5 working days after inspection.'],
                ['Can engraved items be returned?', 'Personalised items can only be returned if they are faulty.'],
                ['What if my item arrives damaged?', 'Send us an unboxing photo or video within 48 hours and we’ll replace it free.'],
            ],
            'Engraving & Custom' => [
                ['How long does engraving take?', 'Engraved orders ship within 48 hours.'],
                ['Can I engrave a logo?', 'Logo debossing is available for corporate orders from 25 pieces.'],
            ],
            'Leather Care' => [
                ['How do I clean my wallet?', 'Wipe with a soft dry cloth. Avoid water and chemical cleaners.'],
                ['How often should I condition it?', 'Every 3 months with a neutral leather conditioner keeps it supple.'],
                ['Will the colour change over time?', 'Full-grain leather develops a rich patina — that’s part of its charm.'],
            ],
            'Account' => [
                ['Do I need an account to order?', 'Yes — sign in with your mobile number, email or Google. Your account lets you track orders and save addresses.'],
                ['How do I reset my password?', 'Tap “Forgot password” on the login page and verify with a code.'],
            ],
        ];

        $out = [];
        foreach ($groups as $group => $rows) {
            foreach ($rows as [$q, $a]) {
                $out[] = ['group' => $group, 'question' => $q, 'answer' => $a];
            }
        }

        return $out;
    }

    public function run(): void
    {
        foreach (self::defaults() as $i => $page) {
            Page::firstOrCreate(['slug' => $page['slug']], [...$page, 'sort_order' => $i, 'is_published' => true]);
        }
    }
}
