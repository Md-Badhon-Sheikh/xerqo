<?php

namespace Database\Seeders;

use App\Models\Banner;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        $banners = [
            ['title' => 'Genuine leather, made to last', 'subtitle' => 'Handcrafted wallets, bags & passport covers — cash on delivery across Bangladesh', 'image' => '/images/cover.jpg', 'link' => '/shop', 'position' => 'home_hero', 'sort_order' => 1],
            ['title' => 'Free name engraving', 'subtitle' => 'Personalise passport covers and wallets at no extra cost', 'image' => '/images/fb-passport-custom.jpg', 'link' => '/shop?category=passport-covers', 'position' => 'home_hero', 'sort_order' => 2],
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
