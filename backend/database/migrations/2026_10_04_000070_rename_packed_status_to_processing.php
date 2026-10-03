<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Order flow is Pending → Confirmed → Processing → Shipped → Delivered.
 * The old "packed" step becomes "processing"; status is a plain string so steps can change without enum migrations.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->change();
        });

        DB::table('orders')->where('status', 'packed')->update(['status' => 'processing']);
        DB::table('order_status_histories')->where('status', 'packed')->update(['status' => 'processing']);
    }

    public function down(): void
    {
        DB::table('orders')->where('status', 'processing')->update(['status' => 'packed']);
        DB::table('order_status_histories')->where('status', 'processing')->update(['status' => 'packed']);
    }
};
