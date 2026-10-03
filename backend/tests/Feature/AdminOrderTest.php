<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminOrderTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
        $category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
        Product::create(['category_id' => $category->id, 'name' => 'Wallet', 'slug' => 'wallet', 'sku' => 'W1', 'price' => 1000, 'stock' => 5, 'status' => 'active']);
        $this->customer = User::factory()->create(['is_active' => true]);
    }

    private function placeOrder(string $method = 'cod', array $extra = []): string
    {
        Sanctum::actingAs($this->customer);

        return $this->postJson('/api/orders', [
            'name' => 'Rahim', 'phone' => '01712345678', 'district' => 'Dhaka', 'address_line' => 'Road 1',
            'payment_method' => $method, 'items' => [['product_id' => Product::first()->id, 'qty' => 1]], ...$extra,
        ])->assertCreated()->json('data.order_number');
    }

    private function actAsStaff(string $role = Role::ADMIN): void
    {
        Sanctum::actingAs(User::factory()->create(['role_id' => Role::where('slug', $role)->value('id'), 'is_active' => true]));
    }

    public function test_status_flow_follows_pending_confirmed_processing_shipped_delivered(): void
    {
        $number = $this->placeOrder();
        $this->actAsStaff();

        $this->patchJson("/api/admin/orders/{$number}/status", ['status' => 'shipped'])->assertUnprocessable();

        foreach (['confirmed', 'processing'] as $status) {
            $this->patchJson("/api/admin/orders/{$number}/status", ['status' => $status])->assertOk()->assertJsonPath('data.status', $status);
        }
        $this->patchJson("/api/admin/orders/{$number}/status", ['status' => 'shipped', 'courier' => 'Steadfast', 'tracking_code' => 'SF123'])
            ->assertOk()
            ->assertJsonPath('data.tracking_code', 'SF123')
            ->assertJsonPath('next_statuses', ['delivered', 'returned', 'cancelled']);
        $this->patchJson("/api/admin/orders/{$number}/status", ['status' => 'delivered'])
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid'); // COD collected

        $this->getJson('/api/admin/orders')->assertOk()->assertJsonPath('counts.delivered', 1)->assertJsonPath('counts.all', 1);
    }

    public function test_verifying_a_payment_marks_paid_and_confirms_the_order(): void
    {
        $number = $this->placeOrder('bkash', ['transaction_id' => 'TX1', 'sender_number' => '01712345678']);
        $this->actAsStaff();

        $this->getJson('/api/admin/payments?status=pending')->assertOk()->assertJsonPath('summary.pending', 1)->assertJsonPath('data.0.order.order_number', $number);

        $payment = Payment::first();
        $this->patchJson("/api/admin/payments/{$payment->id}/verify")->assertOk()->assertJsonPath('data.status', 'verified');
        $this->patchJson("/api/admin/payments/{$payment->id}/verify")->assertUnprocessable(); // only once

        $order = Order::where('order_number', $number)->first();
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('confirmed', $order->status);
    }

    public function test_rejecting_needs_a_reason_and_lets_the_customer_resend(): void
    {
        $number = $this->placeOrder('nagad', ['transaction_id' => 'TX2', 'sender_number' => '01712345678']);
        $this->actAsStaff();
        $payment = Payment::first();

        $this->patchJson("/api/admin/payments/{$payment->id}/reject", [])->assertUnprocessable()->assertJsonValidationErrors('note');
        $this->patchJson("/api/admin/payments/{$payment->id}/reject", ['note' => 'Transaction ID not found'])->assertOk()->assertJsonPath('data.status', 'rejected');
        $this->assertSame('failed', Order::where('order_number', $number)->value('payment_status'));

        // the same transaction id may be sent again after a rejection
        Sanctum::actingAs($this->customer);
        $this->postJson("/api/me/orders/{$number}/payment", ['transaction_id' => 'TX2', 'sender_number' => '01712345678'])
            ->assertOk()->assertJsonPath('data.payment.status', 'pending');
    }

    public function test_roles_without_payment_rights_cannot_verify(): void
    {
        $this->placeOrder('bkash', ['transaction_id' => 'TX3', 'sender_number' => '01712345678']);
        $this->actAsStaff('support');

        $this->patchJson('/api/admin/payments/'.Payment::first()->id.'/verify')->assertForbidden();
    }
}
