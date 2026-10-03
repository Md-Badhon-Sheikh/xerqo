<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

/**
 * Mirrors frontend/src/data/store.js -> categories.
 */
class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['slug' => 'wallets', 'name' => 'Wallets', 'image' => '/images/fb-wallet.jpg', 'description' => 'Bifold, slim & card-slot wallets'],
            ['slug' => 'long-wallets', 'name' => 'Long Wallets', 'image' => '/images/fb-long-wallet.jpg', 'description' => 'Zip-around & clutch long wallets'],
            ['slug' => 'passport-covers', 'name' => 'Passport Covers', 'image' => '/images/fb-passport-hand.jpg', 'description' => 'Passport covers with free name engraving'],
            ['slug' => 'card-holders', 'name' => 'Card Holders', 'image' => '/images/card-tan.jpg', 'description' => 'Slim card holders'],
            ['slug' => 'key-holders', 'name' => 'Key Holders', 'image' => '/images/keys-red.jpg', 'description' => 'Loops, pouches & rings'],
            ['slug' => 'womens-purses', 'name' => "Women's Purses", 'image' => '/images/pink-purse.jpg', 'description' => 'Clasp, crossbody & card purses'],
            ['slug' => 'bags', 'name' => 'Bags', 'image' => '/images/tote.jpg', 'description' => 'Tote, messenger & travel bags'],
            ['slug' => 'belts', 'name' => 'Belts', 'image' => '/images/belt-tan.jpg', 'description' => 'Dress & braided leather belts'],
        ];

        // categories that get a product slider on the home page
        $onHome = ['wallets', 'long-wallets', 'passport-covers', 'key-holders', 'womens-purses', 'bags'];

        foreach ($categories as $index => $category) {
            Category::updateOrCreate(['slug' => $category['slug']], [
                ...$category,
                'sort_order' => $index + 1,
                'is_active' => true,
                'show_on_home' => in_array($category['slug'], $onHome, true),
            ]);
        }
    }
}
