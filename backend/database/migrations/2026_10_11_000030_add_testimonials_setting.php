<?php

use App\Models\Setting;
use Database\Seeders\SettingSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Adds the homepage testimonials options to existing stores (same behaviour as before: 3 reviews, 4★+).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Setting::where('key', 'testimonials')->exists()) {
            [$value, $group, $isPublic] = SettingSeeder::defaults()['testimonials'];
            Setting::setValue('testimonials', $value, $group, $isPublic);
        }
    }

    public function down(): void
    {
        // kept: it may have been edited since
    }
};
