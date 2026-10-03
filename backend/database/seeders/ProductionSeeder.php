<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * What a live store needs on day one: roles and default settings — no demo products, orders or users.
 *
 *   php artisan db:seed --class=ProductionSeeder --force
 *   php artisan xerqo:create-admin
 *
 * Safe to run again: roles and settings are updated in place (settings return to their defaults,
 * so only re-run it on purpose).
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            SettingSeeder::class,
        ]);
    }
}
