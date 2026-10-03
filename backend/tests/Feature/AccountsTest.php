<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\Role;
use App\Models\SmsRecharge;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
        $this->admin = User::factory()->create(['role_id' => Role::where('slug', Role::ADMIN)->value('id'), 'is_active' => true]);
        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));
    }

    private function order(string $number, string $method, string $status, float $total, array $extra = []): Order
    {
        return Order::create([
            'order_number' => $number, 'name' => 'Rahim', 'phone' => '01712345678', 'district' => 'Dhaka', 'address_line' => 'Road 1',
            'delivery_zone' => 'inside_dhaka', 'subtotal' => $total, 'delivery_charge' => 0, 'discount' => 0, 'total' => $total,
            'payment_method' => $method, 'payment_status' => 'pending', 'status' => $status, ...$extra,
        ]);
    }

    public function test_cash_basis_totals_ledger_and_expected_money(): void
    {
        $this->order('XQ-1', 'cod', 'delivered', 2000, ['delivered_at' => now()->subDays(2)]);
        $this->order('XQ-2', 'cod', 'shipped', 1500);                                       // still with the courier
        $bkash = $this->order('XQ-3', 'bkash', 'confirmed', 1200);
        $bkash->payments()->create(['method' => 'bkash', 'amount' => 1200, 'transaction_id' => 'TX1', 'status' => Payment::STATUS_VERIFIED, 'verified_at' => now()->subDay()]);
        $nagad = $this->order('XQ-4', 'nagad', 'pending', 900);
        $nagad->payments()->create(['method' => 'nagad', 'amount' => 900, 'transaction_id' => 'TX2', 'status' => Payment::STATUS_PENDING]);
        $this->order('XQ-5', 'cod', 'delivered', 5000, ['delivered_at' => now()->subMonths(2)]); // outside the range

        $item = Order::where('order_number', 'XQ-1')->first()->items()->create(['name' => 'Wallet', 'price' => 500, 'qty' => 1, 'total' => 500]);
        ReturnRequest::create(['order_id' => $item->order_id, 'order_item_id' => $item->id, 'reason' => 'Size', 'resolution' => 'refund', 'qty' => 1, 'amount' => 500, 'status' => 'completed', 'resolved_at' => now()]);
        Expense::create(['spent_on' => now()->toDateString(), 'category' => 'packaging', 'amount' => 300, 'method' => 'cash', 'description' => 'Boxes']);
        SmsRecharge::create(['amount_paisa' => 20000, 'balance_after_paisa' => 20000, 'rate_paisa' => 35]);

        Sanctum::actingAs($this->admin);
        $res = $this->getJson('/api/admin/accounts?from=2026-10-01&to=2026-10-15')->assertOk();

        $res->assertJsonPath('totals.income_cod', 2000)
            ->assertJsonPath('totals.income_online', 1200)
            ->assertJsonPath('totals.refunds', 500)
            ->assertJsonPath('totals.expenses', 500)       // 300 packaging + 200 SMS
            ->assertJsonPath('totals.profit', 2200)        // 3200 - 500 - 500
            ->assertJsonPath('expected.cod_open', 1500)
            ->assertJsonPath('expected.payments_pending', 900)
            ->assertJsonPath('counts.all', 5)
            ->assertJsonCount(15, 'series');

        $this->getJson('/api/admin/accounts?from=2026-10-01&to=2026-10-15&type=expense')->assertOk()->assertJsonCount(2, 'ledger');
        $this->getJson('/api/admin/accounts?from=2026-01-01&to=2026-10-15')->assertOk()->assertJsonCount(10, 'series'); // monthly
    }

    public function test_expense_crud_with_receipt_and_permissions(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/admin/expenses', ['spent_on' => now()->addDay()->toDateString(), 'category' => 'nope', 'amount' => 0, 'method' => 'cash', 'description' => ''])
            ->assertUnprocessable()->assertJsonValidationErrors(['spent_on', 'category', 'amount', 'description']);

        $id = $this->post('/api/admin/expenses', [
            'spent_on' => now()->toDateString(), 'category' => 'courier', 'amount' => 1250, 'method' => 'bkash', 'description' => 'Steadfast weekly bill',
            'receipt' => UploadedFile::fake()->create('bill.pdf', 120, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated()->json('data.id');
        Storage::disk('public')->assertExists(Expense::find($id)->receipt);

        $this->putJson("/api/admin/expenses/{$id}", ['spent_on' => now()->toDateString(), 'category' => 'courier', 'amount' => 1300, 'method' => 'bkash', 'description' => 'Steadfast weekly bill', 'remove_receipt' => true])->assertOk();
        $this->assertNull(Expense::find($id)->receipt);
        $this->assertDatabaseHas('activity_logs', ['description' => 'Added expense “Steadfast weekly bill”']);

        $viewer = Role::create(['name' => 'Viewer', 'slug' => 'viewer', 'permissions' => ['reports' => ['view']]]);
        Sanctum::actingAs(User::factory()->create(['role_id' => $viewer->id, 'is_active' => true]));
        $this->getJson('/api/admin/accounts')->assertOk();
        $this->deleteJson("/api/admin/expenses/{$id}")->assertForbidden();
    }

    public function test_sales_report(): void
    {
        $category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Bifold', 'slug' => 'bifold', 'sku' => 'B1', 'price' => 1000, 'stock' => 10, 'status' => 'active']);
        foreach ([['XQ-10', 'delivered'], ['XQ-11', 'pending'], ['XQ-12', 'cancelled']] as [$n, $status]) {
            $this->order($n, 'cod', $status, 1000)->items()->create(['product_id' => $product->id, 'name' => 'Bifold', 'price' => 1000, 'qty' => 1, 'total' => 1000]);
        }

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/admin/reports/sales?from=2026-10-01&to=2026-10-15')->assertOk()
            ->assertJsonPath('kpis.revenue', 2000)
            ->assertJsonPath('kpis.orders', 2)
            ->assertJsonPath('kpis.cancelled', 1)
            ->assertJsonPath('categories.0.name', 'Wallets')
            ->assertJsonPath('products.0.units', 2)
            ->assertJsonPath('payments.0.method', 'cod');
    }
}
