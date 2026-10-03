<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_store_links_must_be_urls_and_return_window_bounds(): void
    {
        $this->save(['store' => ['facebook' => 'not a link'], 'returns' => ['window_days' => 99]])
            ->assertUnprocessable()->assertJsonValidationErrors(['settings.store.facebook', 'settings.returns.window_days']);
    }
}
