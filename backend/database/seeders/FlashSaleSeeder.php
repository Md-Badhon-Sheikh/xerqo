<?php

namespace Database\Seeders;

use App\Models\FlashSale;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * A demo flash sale that is live for the next 3 days (re-running the seeder restarts the clock).
 */
class FlashSaleSeeder extends Seeder
{
    public function run(): void
    {
        $sale = FlashSale::updateOrCreate(['title' => 'Flash Sale'], [
            'starts_at' => now()->subHour(),
            'ends_at' => now()->addDays(3),
            'is_active' => true,
        ]);

        // slug => sale price
        $items = [
            'zip-around-long-wallet' => 1790,
            'mini-bifold-wallet' => 890,
            'travel-document-holder' => 1390,
            'teal-crossbody-mini' => 2190,
            'zip-key-pouch' => 490,
            'classic-dress-belt' => 1690,
        ];

        $products = Product::whereIn('slug', array_keys($items))->pluck('id', 'slug');

        $sale->items()->delete();
        foreach (array_keys($items) as $index => $slug) {
            if (isset($products[$slug])) {
                $sale->items()->create(['product_id' => $products[$slug], 'sale_price' => $items[$slug], 'sort_order' => $index]);
            }
        }
    }
}
