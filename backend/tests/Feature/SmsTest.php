<?php

namespace Tests\Feature;

use App\Mail\LowSmsBalance;
use App\Mail\NewOrderAlert;
use App\Mail\OrderPlaced;
use App\Mail\OrderStatusUpdated;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\SmsGateway;
use App\Models\SmsLog;
use App\Models\User;
use App\Services\OrderStatusService;
use App\Services\SmsService;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SmsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
        config(['services.sms.driver' => 'log']);
        SmsGateway::current()->update(['balance_paisa' => 100, 'rate_paisa' => 35, 'low_balance_paisa' => 0]);
    }

    private function staff(string $role): User
    {
        return User::factory()->create(['role_id' => Role::where('slug', $role)->value('id'), 'is_active' => true]);
    }

    private function sms(): SmsService
    {
        return app(SmsService::class);
    }

    public function test_sending_charges_the_wallet_per_part(): void
    {
        $this->assertTrue($this->sms()->send('01712345678', 'Hi Rahim, your order is confirmed.'));
        $this->assertSame(65, SmsGateway::current()->balance_paisa);

        // 71 Bangla characters = 2 Unicode parts = 70 paisa, which the remaining 65 does not cover
        $this->assertFalse($this->sms()->send('01712345678', str_repeat('অ', 71)));
        $this->assertSame(65, SmsGateway::current()->balance_paisa);

        $this->assertDatabaseHas('sms_logs', ['status' => 'sent', 'cost_paisa' => 35, 'segments' => 1, 'encoding' => 'gsm']);
        $this->assertDatabaseHas('sms_logs', ['status' => 'skipped', 'reason' => 'SMS balance too low', 'segments' => 2, 'encoding' => 'unicode']);
    }

    public function test_switched_off_sms_is_not_sent_or_charged(): void
    {
        SmsGateway::current()->update(['is_enabled' => false]);

        $this->assertFalse($this->sms()->send('01712345678', 'Hello'));
        $this->assertSame(100, SmsGateway::current()->balance_paisa);
        $this->assertDatabaseHas('sms_logs', ['status' => 'skipped', 'reason' => 'SMS is switched off']);
    }

    public function test_reve_driver_posts_the_message_and_refunds_a_refused_one(): void
    {
        config(['services.sms.driver' => 'reve']);
        SmsGateway::current()->update(['api_key' => 'key-123', 'secret_key' => 'secret-456', 'sender_id' => '8809601000000']);

        Http::fakeSequence()
            ->push(['Status' => '0', 'Text' => 'ACCEPTD', 'Message_ID' => '9001'])
            ->push(['Status' => '108', 'Text' => 'Wrong Password']);

        $this->assertTrue($this->sms()->send('01712345678', 'Order XQ-1 shipped'));
        Http::assertSent(fn (Request $r) => $r->url() === 'https://smpp.revesms.com:7790/sendtext'
            && $r['apikey'] === 'key-123' && $r['secretkey'] === 'secret-456'
            && $r['callerID'] === '8809601000000' && $r['toUser'] === '8801712345678' && $r['messageContent'] === 'Order XQ-1 shipped');

        $this->assertFalse($this->sms()->send('01712345678', 'Second'));
        $this->assertSame(65, SmsGateway::current()->balance_paisa); // the refused one was given back
        $this->assertDatabaseHas('sms_logs', ['status' => 'sent', 'gateway_message_id' => '9001']);
        $this->assertDatabaseHas('sms_logs', ['status' => 'failed', 'reason' => 'Wrong or missing secret key', 'cost_paisa' => 0]);
    }

    public function test_reve_driver_without_keys_skips(): void
    {
        config(['services.sms.driver' => 'reve']);
        Http::fake();

        $this->assertFalse($this->sms()->send('01712345678', 'Hello'));
        Http::assertNothingSent();
        $this->assertSame(100, SmsGateway::current()->balance_paisa);
    }

    public function test_customer_who_turned_off_order_sms_still_gets_security_codes(): void
    {
        User::factory()->create(['phone' => '01712345678', 'notify_order_sms' => false]);

        $this->assertFalse($this->sms()->sendTemplate('01712345678', 'order_confirmed', ['name' => 'Rahim', 'order_id' => 'XQ-1', 'total' => '100']));
        $this->assertTrue($this->sms()->sendTemplate('01712345678', 'password_otp', ['otp' => '123456', 'minutes' => 5]));

        $this->assertDatabaseHas('sms_logs', ['template' => 'order_confirmed', 'status' => 'skipped', 'reason' => 'Customer turned off order SMS']);
        $this->assertDatabaseHas('sms_logs', ['template' => 'password_otp', 'status' => 'sent']);
    }

    public function test_low_balance_email_goes_to_super_admins_once(): void
    {
        Mail::fake();
        $boss = $this->staff(Role::SUPER_ADMIN);
        $this->staff(Role::ADMIN);
        SmsGateway::current()->update(['low_balance_paisa' => 80]);

        $this->sms()->send('01712345678', 'One');
        $this->sms()->send('01712345678', 'Two');

        Mail::assertQueued(LowSmsBalance::class, 1);
        Mail::assertQueued(LowSmsBalance::class, fn ($mail) => $mail->hasTo($boss->email) && $mail->smsLeft === 1);
    }

    public function test_gateway_and_wallet_are_super_admin_only(): void
    {
        Sanctum::actingAs($this->staff(Role::ADMIN));

        $this->getJson('/api/admin/sms')->assertOk()->assertJsonPath('gateway.balance', 1)->assertJsonMissingPath('gateway.api_key');
        $this->getJson('/api/admin/sms/gateway')->assertForbidden();
        $this->putJson('/api/admin/sms/gateway', ['is_enabled' => false])->assertForbidden();
        $this->postJson('/api/admin/sms/recharges', ['amount' => 500])->assertForbidden();
    }

    public function test_super_admin_sets_keys_rate_and_tops_up(): void
    {
        Sanctum::actingAs($this->staff(Role::SUPER_ADMIN));

        $this->putJson('/api/admin/sms/gateway', ['api_key' => 'abcdef123456', 'secret_key' => 'zzzz9999', 'sender_id' => 'XERQO', 'rate_paisa' => 50, 'low_balance' => 200])
            ->assertOk()
            ->assertJsonPath('data.api_key', '••••••••3456')
            ->assertJsonPath('data.is_configured', true)
            ->assertJsonPath('data.low_balance', 200);

        // a blank key keeps the saved one
        $this->putJson('/api/admin/sms/gateway', ['api_key' => '', 'is_enabled' => false])->assertOk()->assertJsonPath('data.api_key', '••••••••3456');
        $this->assertSame('abcdef123456', SmsGateway::current()->api_key);
        $this->assertStringNotContainsString('abcdef123456', (string) SmsGateway::current()->getRawOriginal('api_key')); // stored encrypted

        $this->postJson('/api/admin/sms/recharges', ['amount' => 500, 'note' => 'bKash to Reve'])
            ->assertCreated()
            ->assertJsonPath('data.balance', 501)
            ->assertJsonPath('data.sms_left', 1002);

        $this->postJson('/api/admin/sms/recharges', ['amount' => -1000])->assertUnprocessable()->assertJsonValidationErrors('amount');
        $this->getJson('/api/admin/sms/recharges')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.sms', 1000);
    }

    public function test_admin_edits_a_template_and_sends_a_test(): void
    {
        Sanctum::actingAs($this->staff(Role::ADMIN));

        $this->putJson('/api/admin/sms/templates/order_shipped', ['enabled' => true, 'body' => '{name}, {order_id} shipped!'])
            ->assertOk()->assertJsonPath('data.name', 'Shipped');
        $this->putJson('/api/admin/sms/templates/nope', ['enabled' => true, 'body' => 'x'])->assertNotFound();

        $this->postJson('/api/admin/sms/test', ['phone' => '01712345678', 'template' => 'order_shipped'])
            ->assertOk()->assertJsonPath('data.segments', 1);
        $this->assertDatabaseHas('sms_logs', ['message' => 'Rahim, XQ-24817 shipped!', 'status' => 'sent']);

        SmsGateway::current()->update(['balance_paisa' => 0]);
        $this->postJson('/api/admin/sms/test', ['phone' => '01712345678', 'message' => 'Hi'])
            ->assertUnprocessable()->assertJsonPath('message', 'SMS not sent: SMS balance too low.');

        $this->getJson('/api/admin/sms/logs?status=skipped')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_order_emails_are_queued(): void
    {
        Mail::fake();
        $category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Wallet', 'slug' => 'wallet', 'sku' => 'W1', 'price' => 1000, 'stock' => 5, 'status' => 'active']);
        $customer = User::factory()->create(['is_active' => true, 'email' => 'rahim@example.com']);

        Sanctum::actingAs($customer);
        $number = $this->postJson('/api/orders', [
            'name' => 'Rahim', 'phone' => '01712345678', 'district' => 'Dhaka', 'address_line' => 'Road 1',
            'payment_method' => 'cod', 'items' => [['product_id' => $product->id, 'qty' => 1]],
        ])->assertCreated()->json('data.order_number');

        Mail::assertQueued(OrderPlaced::class, fn ($m) => $m->hasTo('rahim@example.com'));
        Mail::assertQueued(NewOrderAlert::class, fn ($m) => $m->hasTo('orders@xerqo.com'));

        app(OrderStatusService::class)->transition(Order::where('order_number', $number)->first(), 'confirmed');
        Mail::assertQueued(OrderStatusUpdated::class, fn ($m) => $m->status === 'confirmed');

        // rendering works
        $this->assertStringContainsString($number, (new OrderPlaced(Order::where('order_number', $number)->first()))->render());

        Sanctum::actingAs($this->staff(Role::ADMIN));
        $this->putJson('/api/admin/sms/email', ['customer_order' => false, 'customer_status' => true, 'admin_new_order' => true, 'admin_email' => null])
            ->assertUnprocessable()->assertJsonValidationErrors('admin_email');
        $this->putJson('/api/admin/sms/email', ['customer_order' => false, 'customer_status' => false, 'admin_new_order' => false, 'admin_email' => null])
            ->assertOk()->assertJsonPath('data.customer_order', false);

        $this->assertSame(1, SmsLog::where('template', 'order_placed')->count());
    }
}
