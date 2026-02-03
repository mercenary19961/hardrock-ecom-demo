<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
    }

    public function test_admin_can_view_users_list(): void
    {
        User::factory()->customer()->count(5)->create();

        $response = $this->actingAs($this->admin)->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 6) // 5 customers + 1 admin
        );
    }

    public function test_admin_can_search_users(): void
    {
        User::factory()->customer()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        User::factory()->customer()->create(['name' => 'Jane Smith', 'email' => 'jane@example.com']);

        $response = $this->actingAs($this->admin)->get('/admin/users?search=john');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('users.data', 1)
        );
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        User::factory()->customer()->count(3)->create();
        User::factory()->admin()->count(2)->create();

        $response = $this->actingAs($this->admin)->get('/admin/users?role=customer');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('users.data', 3)
        );
    }

    public function test_admin_can_edit_user(): void
    {
        $customer = User::factory()->customer()->create();

        $response = $this->actingAs($this->admin)->get("/admin/users/{$customer->id}/edit");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Edit')
            ->has('user')
        );
    }

    public function test_admin_can_update_user(): void
    {
        $customer = User::factory()->customer()->create();

        $response = $this->actingAs($this->admin)
            ->put("/admin/users/{$customer->id}", [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ]);

        $response->assertRedirect('/admin/users');
        $this->assertDatabaseHas('users', [
            'id' => $customer->id,
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);
    }

    public function test_admin_can_delete_customer(): void
    {
        $customer = User::factory()->customer()->create();

        $response = $this->actingAs($this->admin)->delete("/admin/users/{$customer->id}");

        $response->assertRedirect('/admin/users');
        $this->assertSoftDeleted('users', ['id' => $customer->id]);
    }

    public function test_admin_cannot_delete_another_admin(): void
    {
        $anotherAdmin = User::factory()->admin()->create();

        $response = $this->actingAs($this->admin)->delete("/admin/users/{$anotherAdmin->id}");

        $response->assertSessionHasErrors('error');
        $this->assertNotSoftDeleted('users', ['id' => $anotherAdmin->id]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $response = $this->actingAs($this->admin)->delete("/admin/users/{$this->admin->id}");

        $response->assertSessionHasErrors('error');
        $this->assertNotSoftDeleted('users', ['id' => $this->admin->id]);
    }

    public function test_admin_can_send_password_reset_email(): void
    {
        Notification::fake();

        $customer = User::factory()->customer()->create();

        $response = $this->actingAs($this->admin)
            ->post("/admin/users/{$customer->id}/send-reset-email");

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Notification::assertSentTo($customer, ResetPassword::class);
    }

    public function test_admin_can_send_verification_email(): void
    {
        Notification::fake();

        $customer = User::factory()->unverified()->customer()->create();

        $response = $this->actingAs($this->admin)
            ->post("/admin/users/{$customer->id}/send-verification-email");

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Notification::assertSentTo($customer, VerifyEmail::class);
    }

    public function test_admin_cannot_send_verification_email_to_verified_user(): void
    {
        Notification::fake();

        $customer = User::factory()->verifiedViaEmail()->customer()->create();

        $response = $this->actingAs($this->admin)
            ->post("/admin/users/{$customer->id}/send-verification-email");

        $response->assertRedirect();
        $response->assertSessionHas('info');

        Notification::assertNotSentTo($customer, VerifyEmail::class);
    }

    public function test_send_reset_email_is_rate_limited(): void
    {
        $customer = User::factory()->customer()->create();

        // Make 10 requests (rate limit is 10 per hour)
        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($this->admin)
                ->post("/admin/users/{$customer->id}/send-reset-email");
        }

        // 11th request should be throttled
        $response = $this->actingAs($this->admin)
            ->post("/admin/users/{$customer->id}/send-reset-email");

        $response->assertStatus(429); // Too Many Requests
    }

    public function test_send_verification_email_is_rate_limited(): void
    {
        $customer = User::factory()->unverified()->customer()->create();

        // Make 10 requests (rate limit is 10 per hour)
        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($this->admin)
                ->post("/admin/users/{$customer->id}/send-verification-email");
        }

        // 11th request should be throttled
        $response = $this->actingAs($this->admin)
            ->post("/admin/users/{$customer->id}/send-verification-email");

        $response->assertStatus(429); // Too Many Requests
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $customer = User::factory()->customer()->create();

        $response = $this->actingAs($customer)->get('/admin/users');

        $response->assertStatus(403);
    }

    public function test_guest_cannot_access_user_management(): void
    {
        $response = $this->get('/admin/users');

        $response->assertRedirect('/login');
    }

    public function test_role_counts_are_correct(): void
    {
        User::factory()->customer()->count(5)->create();
        User::factory()->admin()->count(2)->create();

        $response = $this->actingAs($this->admin)->get('/admin/users');

        $response->assertInertia(fn ($page) => $page
            ->where('roleCounts.all', 8) // 5 customers + 2 admins + 1 admin (self)
            ->where('roleCounts.admin', 3)
            ->where('roleCounts.customer', 5)
        );
    }

    public function test_pagination_works_correctly(): void
    {
        User::factory()->customer()->count(20)->create();

        $response = $this->actingAs($this->admin)->get('/admin/users?per_page=10');

        $response->assertInertia(fn ($page) => $page
            ->has('users.data', 10)
            ->where('users.per_page', 10)
            ->where('users.total', 21) // 20 customers + 1 admin (self)
        );
    }
}
