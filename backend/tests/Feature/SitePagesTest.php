<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Role;
use App\Models\User;
use App\Support\Html;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SitePagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        return User::factory()->create(['role_id' => Role::where('slug', Role::ADMIN)->value('id'), 'is_active' => true]);
    }

    public function test_the_old_policy_and_faq_pages_exist_as_editable_pages(): void
    {
        $this->getJson('/api/pages/returns-exchange')->assertOk()
            ->assertJsonPath('data.title', 'Returns & Exchange Policy')
            ->assertJsonPath('data.type', 'page');
        $this->getJson('/api/pages/faq')->assertOk()
            ->assertJsonPath('data.type', 'faq')
            ->assertJsonPath('data.faqs.0.group', 'Orders & Payment');
        $this->getJson('/api/pages/nope')->assertNotFound();
    }

    public function test_staff_create_edit_hide_and_delete_pages(): void
    {
        $this->postJson('/api/admin/site-pages', ['title' => 'X', 'type' => 'page', 'is_published' => true])->assertUnauthorized();
        Sanctum::actingAs($this->admin());

        $id = $this->postJson('/api/admin/site-pages', [
            'title' => 'Size Guide', 'type' => 'page', 'is_published' => true,
            'content' => '<h2>Belts</h2><p onclick="x()">Measure <b>your</b> waist <a href="javascript:alert(1)">here</a></p><script>alert(1)</script>',
        ])->assertCreated()->assertJsonPath('data.slug', 'size-guide')->json('data.id');

        $content = Page::find($id)->content;
        $this->assertStringContainsString('<h2>Belts</h2>', $content);
        $this->assertStringContainsString('<b>your</b>', $content);
        $this->assertStringNotContainsString('script', $content);
        $this->assertStringNotContainsString('onclick', $content);
        $this->assertStringNotContainsString('javascript', $content);

        $this->getJson('/api/pages/size-guide')->assertOk()->assertJsonPath('data.title', 'Size Guide');

        // the address must be unique
        $this->postJson('/api/admin/site-pages', ['title' => 'Size guide', 'type' => 'page', 'is_published' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('slug');

        // FAQ page: questions are required, content is dropped
        $this->putJson("/api/admin/site-pages/{$id}", ['title' => 'Size Guide', 'slug' => 'size-guide', 'type' => 'faq', 'is_published' => true, 'faqs' => [['question' => '', 'answer' => 'x']]])
            ->assertUnprocessable()->assertJsonValidationErrors('faqs.0.question');
        $this->putJson("/api/admin/site-pages/{$id}", ['title' => 'Size Guide', 'slug' => 'sizes', 'type' => 'faq', 'is_published' => false, 'content' => '<p>x</p>', 'faqs' => [['group' => 'Belts', 'question' => 'Which size?', 'answer' => 'Your waist + 2 inches.']]])
            ->assertOk()->assertJsonPath('data.slug', 'sizes')->assertJsonPath('data.content', null);

        // hidden pages are not public
        $this->getJson('/api/pages/sizes')->assertNotFound();
        $this->getJson('/api/admin/site-pages')->assertOk()->assertJsonFragment(['slug' => 'sizes', 'is_published' => false]);

        $this->deleteJson("/api/admin/site-pages/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('pages', ['id' => $id]);
    }

    public function test_staff_without_content_access_cannot_manage_pages(): void
    {
        $role = Role::create(['name' => 'Packer', 'slug' => 'packer', 'permissions' => ['orders' => ['view']]]);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id, 'is_active' => true]));

        $this->getJson('/api/admin/site-pages')->assertForbidden();
    }

    public function test_html_cleaner_keeps_formatting_and_drops_the_rest(): void
    {
        $this->assertSame('<p>Hi <strong>there</strong></p>', Html::clean('<p style="color:red">Hi <strong>there</strong></p>'));
        $this->assertSame('<p>text</p>', Html::clean('<div><p>text</p></div>'));
        $this->assertSame('<a href="/shop">Shop</a> <a>bad</a>', Html::clean('<a href="/shop" target="_blank">Shop</a> <a href="data:text/html,x">bad</a>'));
        $this->assertNull(Html::clean('<script>alert(1)</script>'));
        $this->assertSame('<p>বাংলা লেখা</p>', Html::clean('<p>বাংলা লেখা</p>'));
    }
}
