<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SettingSeeder::class);
        $category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
        $this->product = Product::create(['category_id' => $category->id, 'name' => 'Wallet', 'slug' => 'wallet', 'sku' => 'W1', 'price' => 1000, 'stock' => 5, 'status' => 'active']);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Rahim', 'phone' => '01712345678', 'district' => 'Sylhet', 'address_line' => 'Road 1',
            'payment_method' => 'cod', 'items' => [['product_id' => $this->product->id, 'qty' => 1]],
            ...$overrides,
        ];
    }

    public function test_guests_cannot_place_orders(): void
    {
        $this->postJson('/api/orders', $this->payload())->assertUnauthorized();
    }

    public function test_cod_order_zone_follows_district_and_billing_can_differ(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_active' => true]));

        // client tries the cheaper inside-Dhaka rate for a Sylhet address
        $this->postJson('/api/orders', $this->payload([
            'delivery_zone' => 'inside_dhaka',
            'billing_same' => false, 'billing_name' => 'Office', 'billing_phone' => '01812345678', 'billing_address' => 'Gulshan',
        ]))->assertCreated()
            ->assertJsonPath('data.delivery_zone', 'outside_dhaka')
            ->assertJsonPath('data.delivery_charge', 120)
            ->assertJsonPath('data.total', 1120)
            ->assertJsonPath('data.billing.name', 'Office')
            ->assertJsonPath('data.payment', null);
    }

    public function test_wallet_payment_needs_transaction_and_cannot_reuse_it(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_active' => true]));

        $this->postJson('/api/orders', $this->payload(['payment_method' => 'bkash']))
            ->assertUnprocessable()->assertJsonValidationErrors(['transaction_id', 'sender_number']);

        $this->postJson('/api/orders', $this->payload(['payment_method' => 'bkash', 'transaction_id' => 'abc123', 'sender_number' => '01712345678']))
            ->assertCreated()
            ->assertJsonPath('data.payment.status', 'pending')
            ->assertJsonPath('data.payment.transaction_id', 'ABC123')
            ->assertJsonPath('data.payment_status', 'pending');

        $this->postJson('/api/orders', $this->payload(['payment_method' => 'rocket', 'transaction_id' => 'ABC123', 'sender_number' => '01712345678']))
            ->assertUnprocessable()->assertJsonValidationErrors('transaction_id');
    }

    public function test_disabled_method_is_rejected(): void
    {
        Setting::setValue('payments', [...Setting::getValue('payments'), 'rocket' => ['enabled' => false, 'label' => 'Rocket']], 'payments', true);
        Sanctum::actingAs(User::factory()->create(['is_active' => true]));

        $this->postJson('/api/orders', $this->payload(['payment_method' => 'rocket', 'transaction_id' => 'X1', 'sender_number' => '01712345678']))
            ->assertUnprocessable()->assertJsonValidationErrors('payment_method');
    }

    public function test_bank_transfer_slip_upload_and_resubmission_after_rejection(): void
    {
        Storage::fake('public');
        $user = User::factory()->create(['is_active' => true]);
        Sanctum::actingAs($user);

        $number = $this->postJson('/api/orders', $this->payload(['payment_method' => 'bank']))->assertCreated()->json('data.order_number');

        $this->postJson("/api/me/orders/{$number}/payment", [])->assertUnprocessable()->assertJsonValidationErrors('proof');
        $this->post("/api/me/orders/{$number}/payment", ['proof' => UploadedFile::fake()->image('slip.jpg')], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.payment.status', 'pending')
            ->assertJsonPath('data.payment.proof', fn ($url) => str_contains($url, 'payments/'));

        // staff reject it -> the customer sends a new slip, which becomes a new pending payment
        $order = Order::where('order_number', $number)->first();
        $order->latestPayment->update(['status' => 'rejected', 'admin_note' => 'Slip unreadable']);
        $order->update(['payment_status' => 'failed']);

        $this->post("/api/me/orders/{$number}/payment", ['proof' => UploadedFile::fake()->image('slip2.jpg')], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.payment.status', 'pending')
            ->assertJsonPath('data.payment_status', 'pending');
        $this->assertSame(2, $order->payments()->count());
    }
}
