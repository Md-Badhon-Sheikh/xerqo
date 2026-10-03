<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['slug' => 'xerqo', 'name' => 'XERQO', 'description' => 'Everyday wallets, bags and accessories in full-grain leather.'],
            ['slug' => 'xerqo-travel', 'name' => 'XERQO Travel', 'description' => 'Passport covers, document holders and travel carry.'],
        ];

        foreach ($brands as $index => $brand) {
            Brand::updateOrCreate(['slug' => $brand['slug']], [...$brand, 'sort_order' => $index + 1, 'is_active' => true]);
        }
    }
}
