<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
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

    public function test_guest_cannot_access_categories_index(): void
    {
        $response = $this->get('/admin/categories');
        $response->assertRedirect('/login');
    }

    public function test_customer_cannot_access_categories_index(): void
    {
        $customer = $this->createCustomer();

        $response = $this->actingAs($customer)->get('/admin/categories');

        $response->assertForbidden();
    }

    public function test_admin_can_access_categories_index(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/categories');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Categories/Index')
                ->has('categories')
            );
    }

    // ===========================================
    // Categories List Tests
    // ===========================================

    public function test_categories_index_shows_categories(): void
    {
        $admin = $this->createAdmin();
        Category::factory()->count(5)->create();

        $response = $this->actingAs($admin)->get('/admin/categories');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Categories/Index')
                ->has('categories.data', 5)
            );
    }

    public function test_categories_can_be_searched(): void
    {
        $admin = $this->createAdmin();
        Category::factory()->create(['name' => 'Electronics']);
        Category::factory()->create(['name' => 'Fashion']);

        $response = $this->actingAs($admin)->get('/admin/categories?search=Electron');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('categories.data', 1)
            );
    }

    public function test_categories_can_be_filtered_by_status(): void
    {
        $admin = $this->createAdmin();
        Category::factory()->count(3)->create(['is_active' => true]);
        Category::factory()->count(2)->inactive()->create();

        $response = $this->actingAs($admin)->get('/admin/categories?status=inactive');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('categories.data', 2)
            );
    }

    public function test_categories_shows_hierarchical_structure(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $parent */
        $parent = Category::factory()->create(['name' => 'Parent']);
        Category::factory()->child($parent)->create(['name' => 'Child']);

        $response = $this->actingAs($admin)->get('/admin/categories');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('categories.data', 2)
            );
    }

    // ===========================================
    // Create Category Tests
    // ===========================================

    public function test_admin_can_view_create_category_page(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/categories/create');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Categories/Create')
                ->has('parentCategories')
            );
    }

    public function test_admin_can_create_category(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/categories', [
            'name' => 'New Category',
            'name_ar' => 'فئة جديدة',
            'description' => 'Category description',
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/categories');
        $this->assertDatabaseHas('categories', [
            'name' => 'New Category',
            'name_ar' => 'فئة جديدة',
        ]);
    }

    public function test_create_category_validates_required_fields(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/categories', []);

        $response->assertSessionHasErrors(['name']);
    }

    public function test_create_category_validates_unique_slug(): void
    {
        $admin = $this->createAdmin();
        Category::factory()->create(['name' => 'Existing', 'slug' => 'existing']);

        $response = $this->actingAs($admin)->post('/admin/categories', [
            'name' => 'Different Name',
            'slug' => 'existing', // Duplicate slug
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    public function test_create_category_with_image(): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        Storage::fake('public');
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/categories', [
            'name' => 'Category With Image',
            'is_active' => true,
            'image' => UploadedFile::fake()->image('category.jpg'),
        ]);

        $response->assertRedirect('/admin/categories');
        /** @var Category $category */
        $category = Category::where('name', 'Category With Image')->first();
        $this->assertNotNull($category->image);
    }

    public function test_create_subcategory(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $parent */
        $parent = Category::factory()->create(['name' => 'Parent']);

        $response = $this->actingAs($admin)->post('/admin/categories', [
            'name' => 'Subcategory',
            'parent_id' => $parent->id,
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/categories');
        $this->assertDatabaseHas('categories', [
            'name' => 'Subcategory',
            'parent_id' => $parent->id,
        ]);
    }

    public function test_create_category_generates_slug(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)->post('/admin/categories', [
            'name' => 'My New Category',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('categories', [
            'name' => 'My New Category',
            'slug' => 'my-new-category',
        ]);
    }

    // ===========================================
    // Edit Category Tests
    // ===========================================

    public function test_admin_can_view_edit_category_page(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $category */
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->get("/admin/categories/{$category->id}/edit");

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Categories/Edit')
                ->has('category')
                ->has('parentCategories')
            );
    }

    public function test_admin_can_update_category(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $category */
        $category = Category::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($admin)->patch("/admin/categories/{$category->id}", [
            'name' => 'Updated Name',
            'is_active' => true,
        ]);

        $response->assertRedirect("/admin/categories/{$category->id}/edit");
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_update_category_validates_unique_slug(): void
    {
        $admin = $this->createAdmin();
        Category::factory()->create(['name' => 'Other Category', 'slug' => 'other-category']);
        /** @var Category $category */
        $category = Category::factory()->create(['name' => 'My Category', 'slug' => 'my-category']);

        $response = $this->actingAs($admin)->patch("/admin/categories/{$category->id}", [
            'name' => 'Updated Name',
            'slug' => 'other-category', // Already exists
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    public function test_update_category_can_keep_same_name(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $category */
        $category = Category::factory()->create(['name' => 'My Category']);

        $response = $this->actingAs($admin)->patch("/admin/categories/{$category->id}", [
            'name' => 'My Category', // Same name is OK
            'description' => 'Updated description',
            'is_active' => true,
        ]);

        $response->assertRedirect("/admin/categories/{$category->id}/edit");
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'description' => 'Updated description',
        ]);
    }

    // ===========================================
    // Delete Category Tests
    // ===========================================

    public function test_admin_can_delete_category(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $category */
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->delete("/admin/categories/{$category->id}");

        $response->assertRedirect('/admin/categories');
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_category_with_children(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $parent */
        $parent = Category::factory()->create();
        Category::factory()->child($parent)->create();

        $response = $this->actingAs($admin)->delete("/admin/categories/{$parent->id}");

        $response->assertRedirect();
        $response->assertSessionHasErrors();
        $this->assertDatabaseHas('categories', ['id' => $parent->id]);
    }

    public function test_cannot_delete_category_with_products(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $category */
        $category = Category::factory()->create();
        Product::factory()->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->delete("/admin/categories/{$category->id}");

        $response->assertRedirect();
        $response->assertSessionHasErrors();
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    // ===========================================
    // Cascade Inactive Tests
    // ===========================================

    public function test_can_cascade_inactive_to_children(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $parent */
        $parent = Category::factory()->create(['is_active' => true]);
        /** @var Category $child1 */
        $child1 = Category::factory()->child($parent)->create(['is_active' => true]);
        /** @var Category $child2 */
        $child2 = Category::factory()->child($parent)->create(['is_active' => true]);

        $response = $this->actingAs($admin)->patch("/admin/categories/{$parent->id}", [
            'name' => $parent->name,
            'is_active' => false,
            'cascade_inactive' => true,
        ]);

        $response->assertRedirect();
        $child1->refresh();
        $child2->refresh();
        $this->assertFalse($child1->is_active);
        $this->assertFalse($child2->is_active);
    }

    public function test_can_deactivate_without_cascade(): void
    {
        $admin = $this->createAdmin();
        /** @var Category $parent */
        $parent = Category::factory()->create(['is_active' => true]);
        /** @var Category $child */
        $child = Category::factory()->child($parent)->create(['is_active' => true]);

        $response = $this->actingAs($admin)->patch("/admin/categories/{$parent->id}", [
            'name' => $parent->name,
            'is_active' => false,
            'cascade_inactive' => false,
        ]);

        $response->assertRedirect();
        $child->refresh();
        $this->assertTrue($child->is_active); // Child stays active
    }

    // ===========================================
    // Status Counts Tests
    // ===========================================

    public function test_categories_index_shows_status_counts(): void
    {
        $admin = $this->createAdmin();
        Category::factory()->count(3)->create(['is_active' => true]);
        Category::factory()->count(2)->inactive()->create();

        $response = $this->actingAs($admin)->get('/admin/categories');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('statusCounts')
                ->where('statusCounts.active', 3)
                ->where('statusCounts.inactive', 2)
            );
    }
}
