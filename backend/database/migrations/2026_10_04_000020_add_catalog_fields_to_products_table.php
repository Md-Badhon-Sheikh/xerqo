<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('category_id')->constrained()->nullOnDelete();
            $table->boolean('is_featured')->default(false)->after('badge');

            $table->index(['status', 'is_featured']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            // "name" holds the colour name (e.g. "Cognac"); hex drives the swatch
            $table->string('color_hex', 7)->nullable()->after('name');
            $table->string('image')->nullable()->after('color_hex');
        });

        Schema::table('categories', function (Blueprint $table) {
            // show a product slider for this category on the home page
            $table->boolean('show_on_home')->default(false)->after('is_active');
        });

        Schema::table('banners', function (Blueprint $table) {
            $table->string('eyebrow', 60)->nullable()->after('title');
            $table->string('button_text', 40)->nullable()->after('link');
            // false = artwork already contains its own text; show the image only
            $table->boolean('show_text')->default(true)->after('button_text');
        });
    }

    public function down(): void
    {
        Schema::table('banners', fn (Blueprint $table) => $table->dropColumn(['eyebrow', 'button_text', 'show_text']));
        Schema::table('categories', fn (Blueprint $table) => $table->dropColumn('show_on_home'));
        Schema::table('product_variants', fn (Blueprint $table) => $table->dropColumn(['color_hex', 'image']));
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status', 'is_featured']);
            $table->dropConstrainedForeignId('brand_id');
            $table->dropColumn('is_featured');
        });
    }
};
