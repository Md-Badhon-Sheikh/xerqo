<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Mirrors frontend/src/data/store.js -> products (same names, slugs, prices, categories and images).
 */
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // [id, name, category, image, price, oldPrice, extra]
        $products = [
            // Wallets
            [1, 'Classic Bifold Wallet', 'Wallets', 'fb-wallet', 1450, 1750, ['badge' => 'Best seller']],
            [2, 'Slim Croc Wallet', 'Wallets', 'fb-slim-croc', 1290, 1590],
            [3, 'Mini Bifold Wallet', 'Wallets', 'wallet-small', 990, 1290, ['badge' => 'New']],
            [4, 'Noir Bifold Wallet', 'Wallets', 'black-wallet', 1350, null],
            [5, 'Card-Slot Bifold', 'Wallets', 'open-wallet', 1190, 1390, ['stock' => 0]],
            // Long wallets
            [6, 'Heritage Long Wallet', 'Long Wallets', 'fb-long-wallet', 2450, 2800],
            [7, 'Zip-Around Long Wallet', 'Long Wallets', 'zip-key', 1990, 2390],
            [8, 'Premium Long Wallet', 'Long Wallets', 'fb-premium', 2750, null],
            [9, 'Clutch Long Wallet', 'Long Wallets', 'wallet-cash', 2190, 2490],
            [10, 'Travel Long Wallet', 'Long Wallets', 'wallet-float', 2350, null, ['stock' => 0]],
            // Passport covers
            [11, 'Handcrafted Passport Cover', 'Passport Covers', 'fb-passport-hand', 1250, 1450],
            [12, 'Voyager Passport Cover', 'Passport Covers', 'fb-passport-black', 1250, 1450],
            [13, 'Custom Name Passport Cover', 'Passport Covers', 'fb-passport-custom', 1450, 1650, ['badge' => 'Personalise']],
            [14, 'Travel Document Holder', 'Passport Covers', 'card-tan', 1590, null],
            [15, 'Passport Sleeve', 'Passport Covers', 'sleeve', 890, 1090],
            // Key holders
            [16, 'Key Holder — Red', 'Key Holders', 'keys-red', 450, 590],
            [17, 'Grey Loop Key Holder', 'Key Holders', 'grey-key', 490, null],
            [18, 'Ring Key Pouch', 'Key Holders', 'desk-keys', 550, 650],
            [19, 'Floral Key Tag', 'Key Holders', 'keys-flower', 390, null, ['stock' => 0]],
            [20, 'Zip Key Pouch', 'Key Holders', 'zip-key', 590, 690],
            // Women's purses
            [21, 'Rose Clasp Purse', "Women's Purses", 'pink-purse', 2150, 2450],
            [22, 'Teal Crossbody Mini', "Women's Purses", 'teal-bag', 2490, null],
            [23, 'Snap Card Purse', "Women's Purses", 'card-snap', 990, 1190],
            [24, 'Noir Card Purse', "Women's Purses", 'black-card', 950, null],
            [25, 'Suede Bucket Bag', "Women's Purses", 'bag-hand', 3290, 3690],
            // Bags
            [26, 'Everyday Tote Bag', 'Bags', 'tote', 5900, 6500],
            [27, 'Messenger Bag', 'Bags', 'messenger', 6450, null],
            [28, 'Doctor Bag', 'Bags', 'doctor-bag', 8900, 9900],
            [29, 'Executive Briefcase', 'Bags', 'briefcase', 9500, null, ['stock' => 0]],
            [30, 'Leather Backpack', 'Bags', 'backpack', 7800, 8500],
            // Card holders & belts
            [31, 'Slim Card Holder', 'Card Holders', 'card-tan', 890, null, ['badge' => 'New']],
            [32, 'Classic Dress Belt', 'Belts', 'belt-tan', 1890, 2190],
            [33, 'Braided Leather Belt', 'Belts', 'belt-braid', 2090, null],
        ];

        $engravable = ['Wallets', 'Long Wallets', 'Passport Covers', 'Card Holders', 'Key Holders'];

        $descriptions = [
            'Wallets' => 'Hand-stitched from full-grain cowhide leather with a soft, natural finish. Multiple card slots, a full-length note compartment and edges burnished by hand. Ages beautifully with daily use.',
            'Long Wallets' => 'A long wallet crafted from genuine leather with room for notes, cards, coins and a phone. Hand-finished edges and durable waxed thread stitching.',
            'Passport Covers' => 'Genuine leather passport cover with slots for boarding passes and cards. Add your name with free engraving to make it unmistakably yours.',
            'Card Holders' => 'A slim front-pocket card holder in genuine leather. Holds your everyday cards and a few folded notes without the bulk.',
            'Key Holders' => 'A sturdy leather key holder that keeps keys organised and protects your pockets and bag lining from scratches.',
            "Women's Purses" => 'An elegant leather purse with a secure closure, card slots and a roomy main compartment. Handcrafted for everyday style.',
            'Bags' => 'A handcrafted leather bag built for daily carry: strong stitching, quality hardware and a lining that lasts. Leather softens and develops a rich patina over time.',
            'Belts' => 'A full-grain leather belt with a solid metal buckle. Cut from a single piece of leather and hand-finished on the edges.',
        ];

        // Colour options for a few best sellers (product stock = sum of variant stock).
        $variants = [
            'Classic Bifold Wallet' => [['Burgundy Croc', 4], ['Black', 5], ['Tan', 3]],
            'Custom Name Passport Cover' => [['Black', 4], ['Brown', 4], ['Tan', 4]],
            'Heritage Long Wallet' => [['Coffee', 6], ['Black', 6]],
            'Classic Dress Belt' => [['Tan · 34"', 4], ['Tan · 36"', 4], ['Black · 36"', 4]],
        ];

        $categories = Category::pluck('id', 'name');

        foreach ($products as $row) {
            [$id, $name, $category, $image, $price, $oldPrice] = $row;
            $extra = $row[6] ?? [];
            $stock = $extra['stock'] ?? 12;

            $product = Product::updateOrCreate(['slug' => $this->slug($name)], [
                'category_id' => $categories[$category],
                'name' => $name,
                'sku' => sprintf('XQ-%04d', $id),
                'description' => $descriptions[$category],
                'price' => $price,
                'compare_price' => $oldPrice,
                'cost' => round($price * 0.55),
                'stock' => $stock,
                'low_stock_threshold' => 5,
                'is_engravable' => in_array($category, $engravable, true),
                'badge' => $extra['badge'] ?? null,
                'status' => 'active',
                'meta_title' => "{$name} | XERQO Genuine Leather",
                'meta_description' => "Buy the {$name} from XERQO — handcrafted genuine leather, cash on delivery across Bangladesh.",
            ]);

            $product->images()->delete();
            $product->images()->create(['path' => "/images/{$image}.jpg", 'alt' => $name, 'sort_order' => 0]);

            $product->variants()->delete();
            if ($stock > 0 && isset($variants[$name])) {
                foreach ($variants[$name] as $i => [$variantName, $variantStock]) {
                    $product->variants()->create([
                        'name' => $variantName,
                        'sku' => sprintf('XQ-%04d-%d', $id, $i + 1),
                        'price' => null,
                        'stock' => $variantStock,
                    ]);
                }
            }
        }
    }

    /**
     * Same slug rule as the React app: lower-case, non-alphanumerics -> "-", trim dashes.
     */
    private function slug(string $name): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($name)), '-');
    }
}
