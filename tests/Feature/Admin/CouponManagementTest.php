<?php

namespace Tests\Feature\Admin;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CouponManagementTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        /** @var User $admin */
        $admin = User::factory()->admin()->create();
        return $admin;
    }

    private function createCustomer(): User
    {
        /** @var User $customer */
        $customer = User::factory()->customer()->create();
        return $customer;
    }

    // ===========================================
    // Authorization Tests
    // ===========================================

    public function test_guest_cannot_access_coupons_index(): void
    {
        $response = $this->get('/admin/coupons');
        $response->assertRedirect('/login');
    }

    public function test_customer_cannot_access_coupons_index(): void
    {
        $customer = $this->createCustomer();

        $response = $this->actingAs($customer)->get('/admin/coupons');

        $response->assertForbidden();
    }

    public function test_admin_can_access_coupons_index(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/coupons');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Coupons/Index')
                ->has('coupons')
            );
    }

    // ===========================================
    // Coupons List Tests
    // ===========================================

    public function test_coupons_index_shows_coupons(): void
    {
        $admin = $this->createAdmin();
        Coupon::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/coupons');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Coupons/Index')
                ->has('coupons.data', 5)
            );
    }

    public function test_coupons_can_be_searched_by_code(): void
    {
        $admin = $this->createAdmin();
        Coupon::factory()->create(['code' => 'SUMMER2026']);
        Coupon::factory()->create(['code' => 'WINTER2026']);

        $response = $this->actingAs($admin)->get('/admin/coupons?search=SUMMER');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('coupons.data', 1)
            );
    }

    public function test_coupons_can_be_filtered_by_status(): void
    {
        $admin = $this->createAdmin();
        Coupon::factory()->count(3)->create(['is_active' => true]);
        Coupon::factory()->count(2)->inactive()->create();

        $response = $this->actingAs($admin)->get('/admin/coupons?status=inactive');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('coupons.data', 2)
            );
    }

    public function test_coupons_can_be_filtered_by_type(): void
    {
        $admin = $this->createAdmin();
        Coupon::factory()->percentage(10)->count(3)->create();
        Coupon::factory()->fixed(5)->count(2)->create();

        $response = $this->actingAs($admin)->get('/admin/coupons?type=fixed');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('coupons.data', 2)
            );
    }

    public function test_coupons_index_shows_status_counts(): void
    {
        $admin = $this->createAdmin();
        Coupon::factory()->count(3)->create(['is_active' => true]);
        Coupon::factory()->count(2)->inactive()->create();
        Coupon::factory()->expired()->create();

        $response = $this->actingAs($admin)->get('/admin/coupons');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('statusCounts')
            );
    }

    // ===========================================
    // Create Coupon Tests
    // ===========================================

    public function test_admin_can_view_create_coupon_page(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/coupons/create');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Coupons/Create')
            );
    }

    public function test_admin_can_create_percentage_coupon(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'NEWCOUPON',
            'name' => 'New Coupon',
            'type' => 'percentage',
            'value' => 15,
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/coupons');
        $this->assertDatabaseHas('coupons', [
            'code' => 'NEWCOUPON',
            'type' => 'percentage',
            'value' => 15,
        ]);
    }

    public function test_admin_can_create_fixed_coupon(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'FLAT10',
            'name' => 'Flat 10 Off',
            'type' => 'fixed',
            'value' => 10,
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/coupons');
        $this->assertDatabaseHas('coupons', [
            'code' => 'FLAT10',
            'type' => 'fixed',
            'value' => 10,
        ]);
    }

    public function test_create_coupon_validates_required_fields(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', []);

        $response->assertSessionHasErrors(['code', 'name', 'type', 'value']);
    }

    public function test_create_coupon_validates_unique_code(): void
    {
        $admin = $this->createAdmin();
        Coupon::factory()->create(['code' => 'EXISTING']);

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'EXISTING',
            'name' => 'New',
            'type' => 'percentage',
            'value' => 10,
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_create_coupon_with_min_order_amount(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'MINORDER50',
            'name' => 'Min Order 50',
            'type' => 'percentage',
            'value' => 10,
            'min_order_amount' => 50,
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/coupons');
        $this->assertDatabaseHas('coupons', [
            'code' => 'MINORDER50',
            'min_order_amount' => 50,
        ]);
    }

    public function test_create_coupon_with_max_discount(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'CAPPED',
            'name' => 'Capped Discount',
            'type' => 'percentage',
            'value' => 20,
            'max_discount' => 30,
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/coupons');
        $this->assertDatabaseHas('coupons', [
            'code' => 'CAPPED',
            'max_discount' => 30,
        ]);
    }

    public function test_create_coupon_with_usage_limit(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'LIMITED',
            'name' => 'Limited Uses',
            'type' => 'percentage',
            'value' => 10,
            'usage_limit' => 100,
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/coupons');
        $this->assertDatabaseHas('coupons', [
            'code' => 'LIMITED',
            'usage_limit' => 100,
        ]);
    }

    public function test_create_coupon_with_per_user_limit(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'ONCE',
            'name' => 'One Time Use',
            'type' => 'percentage',
            'value' => 10,
            'per_user_limit' => 1,
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/coupons');
        $this->assertDatabaseHas('coupons', [
            'code' => 'ONCE',
            'per_user_limit' => 1,
        ]);
    }

    public function test_create_coupon_with_date_range(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'HOLIDAY',
            'name' => 'Holiday Sale',
            'type' => 'percentage',
            'value' => 25,
            'starts_at' => now()->format('Y-m-d'),
            'expires_at' => now()->addMonth()->format('Y-m-d'),
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/coupons');
        $this->assertDatabaseHas('coupons', [
            'code' => 'HOLIDAY',
        ]);
    }

    public function test_create_coupon_validates_expires_after_starts(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'INVALID',
            'name' => 'Invalid Dates',
            'type' => 'percentage',
            'value' => 10,
            'starts_at' => now()->addMonth()->format('Y-m-d'),
            'expires_at' => now()->format('Y-m-d'), // Before starts_at
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['expires_at']);
    }

    // ===========================================
    // Edit Coupon Tests
    // ===========================================

    public function test_admin_can_view_edit_coupon_page(): void
    {
        $admin = $this->createAdmin();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($admin)->get("/admin/coupons/{$coupon->id}/edit");

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Coupons/Edit')
                ->has('coupon')
            );
    }

    public function test_admin_can_update_coupon(): void
    {
        $admin = $this->createAdmin();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['code' => 'OLD', 'value' => 10]);

        $response = $this->actingAs($admin)->patch("/admin/coupons/{$coupon->id}", [
            'code' => 'UPDATED',
            'name' => 'Updated Coupon',
            'type' => 'percentage',
            'value' => 20,
            'is_active' => true,
        ]);

        $response->assertRedirect("/admin/coupons/{$coupon->id}/edit");
        $this->assertDatabaseHas('coupons', [
            'id' => $coupon->id,
            'code' => 'UPDATED',
            'value' => 20,
        ]);
    }

    public function test_update_coupon_can_keep_same_code(): void
    {
        $admin = $this->createAdmin();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['code' => 'MYCODE']);

        $response = $this->actingAs($admin)->patch("/admin/coupons/{$coupon->id}", [
            'code' => 'MYCODE', // Same code is OK
            'name' => 'Updated Name',
            'type' => 'percentage',
            'value' => 15,
            'is_active' => true,
        ]);

        $response->assertRedirect("/admin/coupons/{$coupon->id}/edit");
    }

    // ===========================================
    // Delete Coupon Tests
    // ===========================================

    public function test_admin_can_delete_unused_coupon(): void
    {
        $admin = $this->createAdmin();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create();

        $response = $this->actingAs($admin)->delete("/admin/coupons/{$coupon->id}");

        $response->assertRedirect('/admin/coupons');
        $this->assertDatabaseMissing('coupons', ['id' => $coupon->id]);
    }

    public function test_cannot_delete_coupon_used_in_orders(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create();

        // Create an order with this coupon
        Order::factory()->forUser($customer)->create([
            'coupon_id' => $coupon->id,
            'coupon_code' => $coupon->code,
        ]);

        $response = $this->actingAs($admin)->delete("/admin/coupons/{$coupon->id}");

        $response->assertRedirect();
        $response->assertSessionHasErrors();
        $this->assertDatabaseHas('coupons', ['id' => $coupon->id]);
    }

    // ===========================================
    // Toggle Active Tests
    // ===========================================

    public function test_admin_can_toggle_coupon_active(): void
    {
        $admin = $this->createAdmin();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin)->patch("/admin/coupons/{$coupon->id}/toggle-active");

        // Returns JSON even for regular requests
        $response->assertOk();
        $coupon->refresh();
        $this->assertFalse($coupon->is_active);
    }

    public function test_toggle_active_returns_json_for_ajax(): void
    {
        $admin = $this->createAdmin();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin)
            ->withHeaders(['Accept' => 'application/json'])
            ->patch("/admin/coupons/{$coupon->id}/toggle-active");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'is_active' => false,
            ]);
    }

    // ===========================================
    // Coupon Statistics Tests
    // ===========================================

    public function test_edit_page_shows_usage_stats(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['usage_count' => 5]);

        // Create orders with this coupon
        Order::factory()->forUser($customer)->count(3)->create([
            'coupon_id' => $coupon->id,
            'coupon_code' => $coupon->code,
            'discount' => 10,
        ]);

        $response = $this->actingAs($admin)->get("/admin/coupons/{$coupon->id}/edit");

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Coupons/Edit')
                ->has('stats')
                ->has('stats.orders_count')
            );
    }

    // ===========================================
    // Coupon Code Formatting Tests
    // ===========================================

    public function test_coupon_code_stored_uppercase(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'lowercase',
            'name' => 'Test',
            'type' => 'percentage',
            'value' => 10,
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('coupons', [
            'code' => 'LOWERCASE',
        ]);
    }
}
