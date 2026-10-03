<?php

namespace Database\Seeders;

use App\Models\Banner;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        $banners = [
            // the cover artwork already carries the brand message, so its text is hidden
            ['title' => 'Genuine leather, made to last', 'subtitle' => 'Handcrafted wallets, bags & passport covers — cash on delivery across Bangladesh', 'image' => '/images/cover.jpg', 'link' => '/shop', 'show_text' => false, 'position' => 'home_hero', 'sort_order' => 1],
            ['title' => 'Cut, stitched & burnished in Dhaka', 'eyebrow' => 'Made by hand', 'subtitle' => 'Full-grain leather goods that only get better with age.', 'image' => '/images/workshop.jpg', 'link' => '/about', 'button_text' => 'Our story', 'position' => 'home_hero', 'sort_order' => 2],
            ['title' => 'The leather bag edit', 'eyebrow' => 'New season', 'subtitle' => 'Totes, messengers and doctor bags in full-grain leather.', 'image' => '/images/leather-close.jpg', 'link' => '/shop?c=bags', 'button_text' => 'Shop bags', 'position' => 'home_hero', 'sort_order' => 3],
            ['title' => 'Free name engraving', 'eyebrow' => 'Personalised', 'subtitle' => 'Personalise passport covers and wallets at no extra cost.', 'image' => '/images/fb-passport-hand.jpg', 'link' => '/shop?c=passport-covers', 'button_text' => 'Customise yours', 'position' => 'home_hero', 'sort_order' => 4],
            ['title' => 'Wallets for every day', 'eyebrow' => 'Bifold · Slim · Card-slot', 'subtitle' => 'Full-grain leather wallets, hand-stitched with waxed thread.', 'image' => '/images/hands-brown.jpg', 'link' => '/shop?c=wallets', 'button_text' => 'Shop wallets', 'position' => 'home_hero', 'sort_order' => 5],
            // the two promo tiles beside the hero slider
            ['title' => 'Your name on your passport cover', 'eyebrow' => 'Personalised', 'image' => '/images/fb-passport-hand.jpg', 'link' => '/product/custom-name-passport-cover', 'button_text' => 'Customise it →', 'position' => 'home_side', 'sort_order' => 1],
            ['title' => 'Cashback on bKash payment', 'eyebrow' => 'bKash', 'subtitle' => 'On orders over ৳1,500 · T&C apply', 'image' => '/images/leather-close.jpg', 'link' => '/shop', 'button_text' => 'Shop now →', 'position' => 'home_side', 'sort_order' => 2],
            ['title' => 'Inside the workshop', 'subtitle' => 'Every piece is cut, stitched and finished by hand in Dhaka', 'image' => '/images/workshop.jpg', 'link' => '/about', 'position' => 'home_middle', 'sort_order' => 1],
            ['title' => 'Free delivery over ৳2,000', 'subtitle' => null, 'image' => '/images/leather-close.jpg', 'link' => '/shop', 'position' => 'announcement', 'sort_order' => 1],
        ];

        foreach ($banners as $banner) {
            Banner::updateOrCreate(
                ['title' => $banner['title'], 'position' => $banner['position']],
                [...$banner, 'is_active' => true],
            );
        }
    }
}
