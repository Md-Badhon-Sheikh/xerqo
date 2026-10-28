<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guest checkout: an order placed without an account gets a secret token (stored hashed) so the buyer can see the
 * thank-you page and upload a payment screenshot. The store can switch guest checkout off in Settings.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('guest_token', 64)->nullable()->after('user_id');
        });

        $auth = (array) Setting::getValue('auth', []);
        if (! array_key_exists('guest_checkout', $auth)) {
            Setting::setValue('auth', [...$auth, 'guest_checkout' => true], 'general', true);
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('guest_token');
        });
    }
};
