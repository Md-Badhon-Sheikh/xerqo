<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\SmsGateway;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerAccountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.debug' => true, 'services.sms.driver' => 'log']); // codes come back as debug_otp
        Setting::setValue('auth', ['otp_login' => true, 'register_otp' => true], 'general', true);
        SmsGateway::current()->update(['balance_paisa' => 10000]); // OTPs are paid from the SMS wallet
    }

    private function sendOtp(string $phone, string $purpose): string
    {
        return $this->postJson('/api/auth/otp/send', ['phone' => $phone, 'purpose' => $purpose])
            ->assertOk()
            ->json('debug_otp');
    }

    public function test_register_needs_the_sms_code_and_marks_the_phone_verified(): void
    {
        $payload = ['name' => 'Rahim', 'phone' => '01712345678', 'password' => 'secret123', 'password_confirmation' => 'secret123'];

        $this->postJson('/api/auth/register', $payload)->assertUnprocessable()->assertJsonValidationErrors('otp');

        $code = $this->sendOtp('01712345678', 'register');
        $this->postJson('/api/auth/register', [...$payload, 'otp' => '000000'])->assertUnprocessable()->assertJsonValidationErrors('otp');

        $this->postJson('/api/auth/register', [...$payload, 'otp' => $code, 'marketing_sms' => true])
            ->assertCreated()
            ->assertJsonPath('user.phone_verified', true)
            ->assertJsonPath('user.marketing_sms', true)
            ->assertJsonPath('user.notify_order_sms', true);
    }

    public function test_otp_login_flow_and_resend_cooldown(): void
    {
        User::factory()->create(['phone' => '01812345678', 'is_active' => true]);

        $this->postJson('/api/auth/otp/send', ['phone' => '01999999999', 'purpose' => 'login'])
            ->assertUnprocessable()->assertJsonValidationErrors('phone');

        $code = $this->sendOtp('01812345678', 'login');
        $this->postJson('/api/auth/otp/send', ['phone' => '01812345678', 'purpose' => 'login'])
            ->assertUnprocessable()->assertJsonPath('errors.phone.0', fn ($m) => str_contains($m, 'Please wait'));

        $this->postJson('/api/auth/otp/login', ['phone' => '01812345678', 'otp' => $code])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id']]);

        // a code works only once
        $this->postJson('/api/auth/otp/login', ['phone' => '01812345678', 'otp' => $code])->assertUnprocessable();
    }

    public function test_changing_phone_requires_a_code_sent_to_the_new_number(): void
    {
        $user = User::factory()->create(['phone' => '01712345678', 'is_active' => true]);
        Sanctum::actingAs($user);

        $this->putJson('/api/me', ['phone' => '01912345678'])->assertUnprocessable()->assertJsonValidationErrors('phone_otp');

        $code = $this->postJson('/api/me/phone/otp', ['phone' => '01912345678'])->assertOk()->json('debug_otp');
        $this->putJson('/api/me', ['phone' => '01912345678', 'phone_otp' => $code, 'marketing_email' => true, 'date_of_birth' => '1994-04-12'])
            ->assertOk()
            ->assertJsonPath('data.phone', '01912345678')
            ->assertJsonPath('data.marketing_email', true)
            ->assertJsonPath('data.date_of_birth', '1994-04-12');
    }

    public function test_customer_can_delete_their_account_with_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret123'), 'is_active' => true]);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/me', ['password' => 'wrong'])->assertUnprocessable();
        $this->deleteJson('/api/me', ['password' => 'secret123'])->assertOk();
        $this->assertModelMissing($user);
    }
}
