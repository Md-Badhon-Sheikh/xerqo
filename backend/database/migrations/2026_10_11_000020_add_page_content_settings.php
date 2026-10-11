<?php

use App\Models\Setting;
use Database\Seeders\SettingSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Adds the editable homepage highlights, About page, Contact page and footer to existing stores
 * (with today's wording), without touching anything already saved.
 */
return new class extends Migration
{
    private const KEYS = ['highlights', 'about', 'contact_page', 'footer'];

    public function up(): void
    {
        $defaults = SettingSeeder::defaults();

        foreach (self::KEYS as $key) {
            if (! Setting::where('key', $key)->exists()) {
                [$value, $group, $isPublic] = $defaults[$key];
                Setting::setValue($key, $value, $group, $isPublic);
            }
        }
    }

    public function down(): void
    {
        // the content stays: it may have been edited since
    }
};
