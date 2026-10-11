<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
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

class PagesAndMessagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
    }

    private function admin(): User
    {
        return User::factory()->create(['role_id' => Role::where('slug', Role::ADMIN)->value('id'), 'is_active' => true]);
    }

    public function test_page_content_is_public_and_editable_by_content_staff(): void
    {
        $this->getJson('/api/settings')->assertOk()
            ->assertJsonPath('data.about.hero.title', 'Crafted for class. Made to last.')
            ->assertJsonPath('data.contact_page.hours', 'Sat–Thu · 10am–8pm')
            ->assertJsonCount(3, 'data.footer.columns');

        $this->putJson('/api/admin/content/pages/about', [])->assertUnauthorized();
        Sanctum::actingAs($this->admin());

        $about = Setting::getValue('about');
        $about['hero']['title'] = 'Made in Dhaka';
        $about['stats'] = [];
        $about['extra'] = 'dropped';
        $this->putJson('/api/admin/content/pages/about', $about)->assertOk()->assertJsonPath('data.hero.title', 'Made in Dhaka');
        $this->assertSame([], Setting::getValue('about.stats'));
        $this->assertNull(Setting::getValue('about.extra'));

        $about['hero']['image'] = 'javascript:alert(1)';
        $about['story'][0]['title'] = '';
        $this->putJson('/api/admin/content/pages/about', $about)->assertUnprocessable()
            ->assertJsonValidationErrors(['hero.image', 'story.0.title']);

        $footer = Setting::getValue('footer');
        $footer['columns'][0]['links'] = [['label' => 'Sale', 'link' => '/shop?sale=1']];
        $this->putJson('/api/admin/content/pages/footer', $footer)->assertOk();
        $this->assertSame('Sale', Setting::getValue('footer.columns.0.links.0.label'));

        $contact = Setting::getValue('contact_page');
        $contact['promo']['enabled'] = true;
        $contact['promo']['text'] = '';
        $this->putJson('/api/admin/content/pages/contact', $contact)->assertUnprocessable()->assertJsonValidationErrors('promo.text');
        $this->putJson('/api/admin/content/pages/blog', [])->assertNotFound();
    }

    public function test_uploaded_page_images_are_removed_when_no_longer_used(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin());

        $url = $this->post('/api/admin/content/images', ['image' => UploadedFile::fake()->image('hero.jpg', 1600, 900)], ['Accept' => 'application/json'])
            ->assertCreated()->json('data.url');
        $this->assertStringStartsWith('/storage/content/', $url);
        $path = substr($url, strlen('/storage/'));
        Storage::disk('public')->assertExists($path);

        $about = Setting::getValue('about');
        $about['hero']['image'] = $url;
        $this->putJson('/api/admin/content/pages/about', $about)->assertOk();
        Storage::disk('public')->assertExists($path);

        $about['hero']['image'] = '/images/tools-hand.jpg';
        $this->putJson('/api/admin/content/pages/about', $about)->assertOk();
        Storage::disk('public')->assertMissing($path);
    }

    public function test_contact_form_saves_a_message_and_staff_can_read_and_delete_it(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $this->postJson('/api/contact', ['name' => 'Rafi', 'phone' => '123', 'message' => 'Hi'])
            ->assertUnprocessable()->assertJsonValidationErrors(['phone', 'message']);

        $this->post('/api/contact', [
            'name' => 'Rafi Ahmed',
            'phone' => '+880 1712-345678',
            'subject' => 'Custom engraving',
            'order_number' => 'XQ-1001',
            'message' => 'Can you engrave two names on one wallet?',
            'photo' => UploadedFile::fake()->image('wallet.jpg'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $message = ContactMessage::sole();
        $this->assertSame('01712345678', $message->phone);
        Storage::disk('public')->assertExists($message->attachment);
        $this->assertSame(1, $admin->unreadNotifications()->count());

        Sanctum::actingAs($admin);
        $this->getJson('/api/admin/badges')->assertJsonPath('data.messages', 1);
        $this->getJson('/api/admin/messages?status=unread&q=engrave')->assertOk()
            ->assertJsonPath('counts.unread', 1)
            ->assertJsonPath('data.0.name', 'Rafi Ahmed')
            ->assertJsonPath('data.0.read', false);

        $this->patchJson("/api/admin/messages/{$message->id}", ['read' => true])->assertOk()->assertJsonPath('data.read', true);
        $this->getJson('/api/admin/messages?status=unread')->assertJsonCount(0, 'data');

        $this->deleteJson("/api/admin/messages/{$message->id}")->assertNoContent();
        $this->assertDatabaseCount('contact_messages', 0);
        Storage::disk('public')->assertMissing($message->attachment);
    }

    public function test_staff_without_customer_access_cannot_see_messages(): void
    {
        $role = Role::create(['name' => 'Packer', 'slug' => 'packer', 'permissions' => ['orders' => ['view']]]);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id, 'is_active' => true]));

        $this->getJson('/api/admin/messages')->assertForbidden();
        $this->getJson('/api/admin/badges')->assertJsonMissingPath('data.messages');
    }
}
