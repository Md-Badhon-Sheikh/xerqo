<?php

use App\Models\Setting;
use Database\Seeders\SettingSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Adds the homepage "Top Selling Products" options to existing stores (on, nothing picked = best sellers as before).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Setting::where('key', 'top_selling')->exists()) {
            [$value, $group, $isPublic] = SettingSeeder::defaults()['top_selling'];
            Setting::setValue('top_selling', $value, $group, $isPublic);
        }
    }

    public function down(): void
    {
        // kept: it may have been edited since
    }
};
