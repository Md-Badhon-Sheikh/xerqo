<?php

use App\Models\Setting;
use Database\Seeders\SettingSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Adds the editable "The XERQO way" homepage section to existing stores, with today's wording and photos.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Setting::where('key', 'craft_story')->exists()) {
            [$value, $group, $isPublic] = SettingSeeder::defaults()['craft_story'];
            Setting::setValue('craft_story', $value, $group, $isPublic);
        }
    }

    public function down(): void
    {
        // kept: it may have been edited since
    }
};
