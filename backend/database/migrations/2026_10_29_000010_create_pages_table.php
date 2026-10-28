<?php

use App\Models\Setting;
use Database\Seeders\PageSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Editable store pages (Admin → Pages) at /pages/{slug}. Adds the policy, FAQ, corporate gifting and wholesale
 * pages with today's text and points the footer's default links at them.
 */
return new class extends Migration
{
    // footer link label => its old default address and the new page
    private const FOOTER_LINKS = [
        'Shipping & Delivery' => ['/policy', '/pages/shipping-delivery'],
        'Returns & Exchange' => ['/policy', '/pages/returns-exchange'],
        'FAQs' => ['/faq', '/pages/faq'],
        'Privacy Policy' => ['/policy', '/pages/privacy-policy'],
        'Terms' => ['/policy', '/pages/terms-conditions'],
        'Corporate Gifting' => ['/contact', '/pages/corporate-gifting'],
        'Wholesale' => ['/contact', '/pages/wholesale'],
    ];

    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->string('slug', 120)->unique();
            $table->string('type', 10)->default('page'); // page | faq
            $table->longText('content')->nullable();     // sanitised HTML
            $table->json('faqs')->nullable();            // [{group, question, answer}]
            $table->string('meta_title', 70)->nullable();
            $table->string('meta_description', 170)->nullable();
            $table->boolean('is_published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        (new PageSeeder)->run();

        // footer links that still point at the old pages
        $footer = Setting::getValue('footer');
        if (is_array($footer) && is_array($footer['columns'] ?? null)) {
            foreach ($footer['columns'] as &$column) {
                if (! is_array($column['links'] ?? null)) {
                    continue;
                }
                foreach ($column['links'] as &$link) {
                    [$old, $new] = self::FOOTER_LINKS[$link['label'] ?? ''] ?? [null, null];
                    if ($old !== null && ($link['link'] ?? null) === $old) {
                        $link['link'] = $new;
                    }
                }
                unset($link);
            }
            unset($column);
            Setting::setValue('footer', $footer);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
