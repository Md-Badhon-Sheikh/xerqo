<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database: php artisan migrate --seed
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            SettingSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            CouponSeeder::class,
            BannerSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
