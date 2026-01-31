<?php

namespace Tests\Feature\Admin;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class SettingsManagementTest extends TestCase
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

    public function test_guest_cannot_access_settings(): void
    {
        $response = $this->get('/admin/settings');
        $response->assertRedirect('/login');
    }

    public function test_customer_cannot_access_settings(): void
    {
        $customer = $this->createCustomer();

        $response = $this->actingAs($customer)->get('/admin/settings');

        $response->assertForbidden();
    }

    public function test_admin_can_access_settings(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/settings');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Settings/Index')
                ->has('settings')
            );
    }

    // ===========================================
    // Settings Display Tests
    // ===========================================

    public function test_settings_page_displays_all_groups(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/settings');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Settings/Index')
                ->has('settings.general')
                ->has('settings.currency')
                ->has('settings.inventory')
            );
    }

    public function test_settings_page_displays_default_values(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/settings');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Settings/Index')
                ->has('settings.general.fields.store_name', fn ($setting) => $setting
                    ->where('value', 'HardRock Store')
                    ->etc()
                )
            );
    }

    public function test_settings_page_displays_saved_values(): void
    {
        $admin = $this->createAdmin();
        Setting::set('store_name', 'Custom Store', 'general', 'text');

        $response = $this->actingAs($admin)->get('/admin/settings');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Settings/Index')
                ->has('settings.general.fields.store_name', fn ($setting) => $setting
                    ->where('value', 'Custom Store')
                    ->etc()
                )
            );
    }

    // ===========================================
    // Settings Update Tests
    // ===========================================

    public function test_admin_can_update_general_settings(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->put('/admin/settings', [
            'store_name' => 'Updated Store Name',
            'store_name_ar' => 'اسم المتجر المحدث',
            'store_email' => 'updated@example.com',
            'store_phone' => '+962 79 999 9999',
            'store_address' => 'New Address',
        ]);

        $response->assertRedirect();

        $this->assertEquals('Updated Store Name', Setting::get('store_name'));
        $this->assertEquals('اسم المتجر المحدث', Setting::get('store_name_ar'));
        $this->assertEquals('updated@example.com', Setting::get('store_email'));
        $this->assertEquals('+962 79 999 9999', Setting::get('store_phone'));
        $this->assertEquals('New Address', Setting::get('store_address'));
    }

    public function test_admin_can_update_currency_settings(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->put('/admin/settings', [
            'currency_code' => 'USD',
            'currency_symbol' => '$',
            'currency_symbol_ar' => 'دولار',
        ]);

        $response->assertRedirect();

        $this->assertEquals('USD', Setting::get('currency_code'));
        $this->assertEquals('$', Setting::get('currency_symbol'));
        $this->assertEquals('دولار', Setting::get('currency_symbol_ar'));
    }

    public function test_admin_can_update_inventory_settings(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->put('/admin/settings', [
            'low_stock_threshold' => 25,
            'out_of_stock_visibility' => false,
            'stock_management' => true,
        ]);

        $response->assertRedirect();

        $this->assertEquals(25, Setting::get('low_stock_threshold'));
        $this->assertEquals(false, Setting::get('out_of_stock_visibility'));
        $this->assertEquals(true, Setting::get('stock_management'));
    }

    public function test_customer_cannot_update_settings(): void
    {
        $customer = $this->createCustomer();

        $response = $this->actingAs($customer)->put('/admin/settings', [
            'store_name' => 'Hacked Store',
        ]);

        $response->assertForbidden();
        $this->assertNotEquals('Hacked Store', Setting::get('store_name'));
    }

    // ===========================================
    // Cache Tests
    // ===========================================

    public function test_settings_update_clears_cache(): void
    {
        $admin = $this->createAdmin();

        // Set a value and cache it
        Setting::set('store_name', 'Original Name', 'general', 'text');
        $this->assertEquals('Original Name', Setting::get('store_name'));

        // Update via controller
        $this->actingAs($admin)->put('/admin/settings', [
            'store_name' => 'Updated Name',
        ]);

        // Cache should be cleared and new value should be retrieved
        $this->assertEquals('Updated Name', Setting::get('store_name'));
    }

    public function test_site_settings_cache_is_cleared_on_update(): void
    {
        $admin = $this->createAdmin();

        // Prime the cache
        Cache::put('site_settings', ['store_name' => 'Cached Value'], 3600);
        $this->assertEquals('Cached Value', Cache::get('site_settings')['store_name']);

        // Update settings
        $this->actingAs($admin)->put('/admin/settings', [
            'store_name' => 'New Value',
        ]);

        // site_settings cache should be cleared
        $this->assertNull(Cache::get('site_settings'));
    }

    // ===========================================
    // Setting Model Tests
    // ===========================================

    public function test_setting_get_returns_default_when_not_set(): void
    {
        $this->assertEquals('default_value', Setting::get('nonexistent_key', 'default_value'));
    }

    public function test_setting_get_returns_saved_value(): void
    {
        Setting::set('test_key', 'test_value', 'general', 'text');

        $this->assertEquals('test_value', Setting::get('test_key'));
    }

    public function test_setting_get_casts_boolean_values(): void
    {
        Setting::set('bool_setting', '1', 'general', 'boolean');

        $this->assertTrue(Setting::get('bool_setting'));
    }

    public function test_setting_get_casts_number_values(): void
    {
        Setting::set('number_setting', '42', 'general', 'number');

        $this->assertIsFloat(Setting::get('number_setting'));
        $this->assertEquals(42, Setting::get('number_setting'));
    }

    public function test_setting_set_updates_existing_value(): void
    {
        Setting::set('update_test', 'initial', 'general', 'text');
        Setting::set('update_test', 'updated', 'general', 'text');

        $this->assertEquals('updated', Setting::get('update_test'));
        $this->assertEquals(1, Setting::where('key', 'update_test')->count());
    }

    // ===========================================
    // Shared Settings Tests (Inertia Middleware)
    // ===========================================

    public function test_site_settings_are_shared_with_all_pages(): void
    {
        $admin = $this->createAdmin();
        Setting::set('store_name', 'Shared Store', 'general', 'text');

        // Clear cache to ensure fresh data
        Cache::forget('site_settings');

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('siteSettings')
                ->where('siteSettings.store_name', 'Shared Store')
            );
    }

    public function test_site_settings_include_all_required_fields(): void
    {
        $admin = $this->createAdmin();
        Cache::forget('site_settings');

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('siteSettings.store_name')
                ->has('siteSettings.store_name_ar')
                ->has('siteSettings.store_email')
                ->has('siteSettings.store_phone')
                ->has('siteSettings.store_address')
                ->has('siteSettings.currency_code')
                ->has('siteSettings.currency_symbol')
                ->has('siteSettings.currency_symbol_ar')
                ->has('siteSettings.low_stock_threshold')
            );
    }

    // ===========================================
    // Low Stock Threshold Integration Tests
    // ===========================================

    public function test_low_stock_threshold_setting_affects_dashboard(): void
    {
        $admin = $this->createAdmin();

        // Create a category first (products need a category)
        $category = \App\Models\Category::factory()->create();

        // Create products with specific stock levels
        \App\Models\Product::factory()->create([
            'stock' => 5,
            'category_id' => $category->id,
            'is_active' => true,
            'low_stock_threshold' => null, // Use global threshold
        ]);
        \App\Models\Product::factory()->create([
            'stock' => 15,
            'category_id' => $category->id,
            'is_active' => true,
            'low_stock_threshold' => null, // Use global threshold
        ]);

        // Set threshold to 10 - only first product should be low stock
        Setting::set('low_stock_threshold', 10, 'inventory', 'number');
        Cache::flush(); // Clear all caches
        Setting::clearCache();

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('lowStockProducts', 1) // Only 1 product with stock <= 10
            );
    }

    public function test_low_stock_threshold_can_be_changed(): void
    {
        $admin = $this->createAdmin();

        // Create a category first (products need a category)
        $category = \App\Models\Category::factory()->create();

        // Create product with stock of 15, no product-level threshold
        \App\Models\Product::factory()->create([
            'stock' => 15,
            'category_id' => $category->id,
            'is_active' => true,
            'low_stock_threshold' => null, // Use category/global threshold
        ]);

        // Set global threshold to 20 - product should be low stock
        // (because 15 <= 20, regardless of category threshold)
        Setting::set('low_stock_threshold', 20, 'inventory', 'number');
        Cache::flush();
        Setting::clearCache();

        // Verify the setting was saved
        $this->assertEquals(20, Setting::get('low_stock_threshold'));
    }
}
