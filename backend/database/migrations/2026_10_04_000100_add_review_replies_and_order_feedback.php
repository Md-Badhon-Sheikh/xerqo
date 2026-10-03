<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('body');
            $table->boolean('is_anonymous')->default(false)->after('tags');
            $table->boolean('is_featured')->default(false)->after('status'); // shown first on the home page
            $table->text('admin_reply')->nullable()->after('is_featured');  // public reply under the review
            $table->timestamp('replied_at')->nullable()->after('admin_reply');
            $table->foreignId('replied_by')->nullable()->after('replied_at')->constrained('users')->nullOnDelete();
        });

        // Private delivery & service feedback — one per order, only staff see it
        Schema::create('order_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('delivery_rating')->nullable();
            $table->unsignedTinyInteger('packaging_rating')->nullable();
            $table->unsignedTinyInteger('courier_rating')->nullable();
            $table->unsignedTinyInteger('support_rating')->nullable();
            $table->unsignedTinyInteger('nps')->nullable(); // 0–10 "would you recommend us"
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_feedback');
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('replied_by');
            $table->dropColumn(['tags', 'is_anonymous', 'is_featured', 'admin_reply', 'replied_at']);
        });
    }
};
