<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
        Sanctum::actingAs(User::factory()->create(['role_id' => Role::where('slug', Role::ADMIN)->value('id'), 'is_active' => true]));
    }

    private function save(array $settings)
    {
        return $this->putJson('/api/admin/settings', ['settings' => $settings]);
    }

    public function test_payment_accounts_are_validated(): void
    {
        $this->save(['payments' => ['bkash' => ['enabled' => true, 'number' => '12345']]])
            ->assertUnprocessable()->assertJsonValidationErrors('settings.payments.bkash.number');

        $this->save(['payments' => ['rocket' => ['enabled' => true, 'number' => '017123456781']]])->assertOk(); // Rocket: 12 digits

        $this->save(['payments' => ['bank' => ['enabled' => true, 'bank_name' => null]]])
            ->assertUnprocessable()->assertJsonValidationErrors('settings.payments.bank.bank_name');

        $off = collect(['cod', 'bkash', 'rocket', 'nagad', 'bank'])->mapWithKeys(fn ($m) => [$m => ['enabled' => false]])->all();
        $this->save(['payments' => $off])->assertUnprocessable()->assertJsonValidationErrors('settings.payments');

        // a disabled wallet keeps its number and other fields
        $this->save(['payments' => ['nagad' => ['enabled' => false]]])->assertOk();
        $this->assertSame('01700000000', Setting::getValue('payments.nagad.number'));
    }

    public function test_courier_list_is_replaced_not_merged(): void
    {
        $this->save(['delivery' => ['couriers' => ['Steadfast']]])->assertOk();
        $this->assertSame(['Steadfast'], Setting::getValue('delivery.couriers'));
        $this->assertSame(60, Setting::getValue('delivery.inside_dhaka')); // other delivery fields untouched

        $this->save(['delivery' => ['couriers' => ['Pathao', 'pathao']]])->assertUnprocessable();
    }

    public function test_public_settings_include_seo_and_maintenance_but_not_private_keys(): void
    {
        $this->save(['maintenance' => ['enabled' => true, 'message' => 'Back at 6 PM'], 'seo' => ['meta_title' => 'XERQO leather']])->assertOk();

        $this->getJson('/api/settings')->assertOk()
            ->assertJsonPath('data.maintenance.enabled', true)
            ->assertJsonPath('data.seo.meta_title', 'XERQO leather')
            ->assertJsonMissingPath('data.sms_templates')
            ->assertJsonMissingPath('data.email_notifications')
            ->assertJsonMissingPath('data.reviews');
    }

    public function test_favicon_and_share_image_upload_replace_and_remove(): void
    {
        Storage::fake('public');

        $this->post('/api/admin/settings/images/favicon', ['image' => UploadedFile::fake()->create('icon.svg', 2, 'image/svg+xml')], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->post('/api/admin/settings/images/og-image', ['image' => UploadedFile::fake()->image('tiny.jpg', 200, 100)], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('image');

        $this->post('/api/admin/settings/images/favicon', ['image' => UploadedFile::fake()->image('icon.png', 64, 64)], ['Accept' => 'application/json'])->assertOk();
        $this->post('/api/admin/settings/images/og-image', ['image' => UploadedFile::fake()->image('share.jpg', 1200, 630)], ['Accept' => 'application/json'])->assertOk();
        $first = Setting::getValue('seo.og_image');
        Storage::disk('public')->assertExists([Setting::getValue('store.favicon'), $first]);
        $this->assertSame(1200, Setting::getValue('seo.og_image_width'));
        $this->assertNotNull(Setting::getValue('store.name')); // other store fields kept
        $this->assertNotNull(Setting::getValue('seo.meta_title'));

        // a new upload replaces the old file
        $this->post('/api/admin/settings/images/og-image', ['image' => UploadedFile::fake()->image('new.png', 1200, 630)], ['Accept' => 'application/json'])->assertOk();
        Storage::disk('public')->assertMissing($first);

        $this->getJson('/api/settings')->assertOk()
            ->assertJsonPath('data.store.favicon_url', Storage::disk('public')->url(Setting::getValue('store.favicon')))
            ->assertJsonPath('data.seo.og_image_url', Storage::disk('public')->url(Setting::getValue('seo.og_image')));

        // the paths can't be set through the normal settings form
        $this->save(['seo' => ['og_image' => 'http://evil.test/x.jpg']])->assertUnprocessable();

        $favicon = Setting::getValue('store.favicon');
        $this->deleteJson('/api/admin/settings/images/favicon')->assertOk();
        Storage::disk('public')->assertMissing($favicon);
        $this->assertNull(Setting::getValue('store.favicon'));
        $this->deleteJson('/api/admin/settings/images/logo')->assertNotFound();
    }

    public function test_pages_are_served_with_settings_in_the_html(): void
    {
        Storage::fake('public');
        $public = sys_get_temp_dir().'/xerqo-shell-'.uniqid();
        mkdir($public);
        file_put_contents($public.'/index.html', <<<'HTML'
            <html><head>
            <link rel="icon" type="image/png" href="/favicon.png" />
            <meta name="description" content="old" />
            <title>Old</title>
            <meta property="og:title" content="Old" />
            <meta property="og:image" content="https://xerqo.test/images/og-image.jpg" />
            <meta property="og:image:type" content="image/jpeg" />
            </head><body><div id="root"></div></body></html>
            HTML);
        $this->app->usePublicPath($public);

        try {
            $this->post('/api/admin/settings/images/favicon', ['image' => UploadedFile::fake()->image('icon.png', 64, 64)], ['Accept' => 'application/json'])->assertOk();
            $this->post('/api/admin/settings/images/og-image', ['image' => UploadedFile::fake()->image('share.png', 1200, 630)], ['Accept' => 'application/json'])->assertOk();
            $this->save(['seo' => ['meta_title' => 'XERQO "Leather" & Co', 'meta_description' => 'Wallets']])->assertOk();

            $html = $this->get('/shop/wallets')->assertOk()->assertCookieMissing('laravel_session')->getContent();
            $og = url(Storage::disk('public')->url(Setting::getValue('seo.og_image')));
            $this->assertStringContainsString('<title>XERQO &quot;Leather&quot; &amp; Co</title>', $html);
            $this->assertStringContainsString('<meta property="og:image" content="'.$og.'" />', $html);
            $this->assertStringContainsString('<meta property="og:image:type" content="image/png" />', $html);
            $this->assertStringContainsString('<meta property="og:image:width" content="1200" />', $html);
            $this->assertStringContainsString('<meta name="twitter:image" content="'.$og.'" />', $html);
            $this->assertStringContainsString('<meta name="description" content="Wallets" />', $html);
            $this->assertStringContainsString('href="'.url(Storage::disk('public')->url(Setting::getValue('store.favicon'))).'"', $html);
            $this->assertStringNotContainsString('/favicon.png', $html);

            $this->get('/')->assertOk()->assertSee('<div id="root">', false);
            $this->getJson('/api/nope')->assertNotFound()->assertJsonStructure(['message']);
        } finally {
            @unlink($public.'/index.html');
            @rmdir($public);
        }
    }

    public function test_store_links_must_be_urls_and_return_window_bounds(): void
    {
        $this->save(['store' => ['facebook' => 'not a link'], 'returns' => ['window_days' => 99]])
            ->assertUnprocessable()->assertJsonValidationErrors(['settings.store.facebook', 'settings.returns.window_days']);
    }
}
