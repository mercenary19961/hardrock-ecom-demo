<?php

namespace Tests\Feature\Admin;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ProductManagementTest extends TestCase
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

    public function test_guest_cannot_access_products_index(): void
    {
        $response = $this->get('/admin/products');
        $response->assertRedirect('/login');
    }

    public function test_customer_cannot_access_products_index(): void
    {
        $customer = $this->createCustomer();

        $response = $this->actingAs($customer)->get('/admin/products');

        $response->assertForbidden();
    }

    public function test_admin_can_access_products_index(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/products');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Products/Index')
                ->has('products')
            );
    }

    // ===========================================
    // Products List Tests
    // ===========================================

    public function test_products_index_shows_products(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        Product::factory()->count(5)->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->get('/admin/products');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Products/Index')
                ->has('products.data', 5)
            );
    }

    public function test_products_can_be_searched(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        Product::factory()->create(['category_id' => $category->id, 'name' => 'Special Widget']);
        Product::factory()->create(['category_id' => $category->id, 'name' => 'Regular Item']);

        $response = $this->actingAs($admin)->get('/admin/products?search=Widget');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('products.data', 1)
            );
    }

    public function test_products_can_be_filtered_by_category(): void
    {
        $admin = $this->createAdmin();
        $category1 = Category::factory()->create(['name' => 'Electronics']);
        $category2 = Category::factory()->create(['name' => 'Fashion']);
        Product::factory()->count(3)->create(['category_id' => $category1->id]);
        Product::factory()->count(2)->create(['category_id' => $category2->id]);

        $response = $this->actingAs($admin)->get('/admin/products?category=' . $category1->id);

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('products.data', 3)
            );
    }

    public function test_products_can_be_filtered_by_status(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        Product::factory()->count(3)->create(['category_id' => $category->id, 'is_active' => true]);
        Product::factory()->count(2)->inactive()->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->get('/admin/products?status=inactive');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('products.data', 2)
            );
    }

    public function test_products_can_be_filtered_by_out_of_stock(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        Product::factory()->count(3)->create(['category_id' => $category->id, 'stock' => 10]);
        Product::factory()->count(2)->outOfStock()->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->get('/admin/products?status=out_of_stock');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('products.data', 2)
            );
    }

    // ===========================================
    // Create Product Tests
    // ===========================================

    public function test_admin_can_view_create_product_page(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/products/create');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Products/Create')
                ->has('categories')
            );
    }

    public function test_admin_can_create_product(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->post('/admin/products', [
            'category_id' => $category->id,
            'name' => 'New Product',
            'name_ar' => 'منتج جديد',
            'description' => 'Product description',
            'price' => 99.99,
            'stock' => 50,
            'sku' => 'NEW-001',
            'is_active' => true,
            'is_featured' => false,
        ]);

        $response->assertRedirect('/admin/products');
        $this->assertDatabaseHas('products', [
            'name' => 'New Product',
            'name_ar' => 'منتج جديد',
            'price' => 99.99,
        ]);
    }

    public function test_create_product_validates_required_fields(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/products', []);

        $response->assertSessionHasErrors(['name', 'category_id', 'price', 'stock']);
    }

    public function test_create_product_with_images(): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD extension is not installed.');
        }

        Storage::fake('public');
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->post('/admin/products', [
            'category_id' => $category->id,
            'name' => 'Product With Images',
            'price' => 49.99,
            'stock' => 10,
            'is_active' => true,
            'is_featured' => false,
            'images' => [
                UploadedFile::fake()->image('product1.jpg'),
                UploadedFile::fake()->image('product2.jpg'),
            ],
        ]);

        $response->assertRedirect('/admin/products');
        /** @var Product $product */
        $product = Product::where('name', 'Product With Images')->first();
        $this->assertCount(2, $product->images);
    }

    public function test_create_product_with_variants(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin)->post('/admin/products', [
            'category_id' => $category->id,
            'name' => 'Variant Product',
            'price' => 79.99,
            'stock' => 0,
            'is_active' => true,
            'is_featured' => false,
            'color' => 'Blue',
            'color_hex' => '#0000FF',
            'available_sizes' => ['S', 'M', 'L', 'XL'],
            'size_stock' => ['S' => 10, 'M' => 20, 'L' => 15, 'XL' => 5],
        ]);

        $response->assertRedirect('/admin/products');
        $this->assertDatabaseHas('products', [
            'name' => 'Variant Product',
            'color' => 'Blue',
            'color_hex' => '#0000FF',
        ]);
    }

    public function test_create_product_generates_slug(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();

        $this->actingAs($admin)->post('/admin/products', [
            'category_id' => $category->id,
            'name' => 'Amazing New Product',
            'price' => 29.99,
            'stock' => 10,
            'is_active' => true,
            'is_featured' => false,
        ]);

        $this->assertDatabaseHas('products', [
            'name' => 'Amazing New Product',
            'slug' => 'amazing-new-product',
        ]);
    }

    // ===========================================
    // Edit Product Tests
    // ===========================================

    public function test_admin_can_view_edit_product_page(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->get("/admin/products/{$product->id}/edit");

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Products/Edit')
                ->has('product')
                ->has('categories')
            );
    }

    public function test_admin_can_update_product(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Old Name',
            'price' => 50,
        ]);

        $response = $this->actingAs($admin)->patch("/admin/products/{$product->id}", [
            'category_id' => $category->id,
            'name' => 'Updated Name',
            'price' => 75,
            'stock' => $product->stock,
            'is_active' => true,
            'is_featured' => false,
        ]);

        $response->assertRedirect("/admin/products/{$product->id}/edit");
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Name',
            'price' => 75,
        ]);
    }

    public function test_update_product_validates_price(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->patch("/admin/products/{$product->id}", [
            'category_id' => $category->id,
            'name' => 'Test',
            'price' => -10,
            'stock' => 10,
            'is_active' => true,
            'is_featured' => false,
        ]);

        $response->assertSessionHasErrors(['price']);
    }

    // ===========================================
    // Delete Product Tests
    // ===========================================

    public function test_admin_can_delete_product(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->delete("/admin/products/{$product->id}");

        $response->assertRedirect('/admin/products');
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_cannot_delete_product_in_pending_orders(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create(['category_id' => $category->id]);

        // Create a pending order with this product
        /** @var Order $order */
        $order = Order::factory()->pending()->create();
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 1,
            'price' => $product->price,
            'subtotal' => $product->price,
        ]);

        $response = $this->actingAs($admin)->delete("/admin/products/{$product->id}");

        $response->assertRedirect();
        $response->assertSessionHasErrors();
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_cannot_delete_product_in_customer_carts(): void
    {
        $admin = $this->createAdmin();
        /** @var User $customer */
        $customer = User::factory()->customer()->create();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create(['category_id' => $category->id]);

        // Add to customer's cart
        $cart = Cart::create(['user_id' => $customer->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response = $this->actingAs($admin)->delete("/admin/products/{$product->id}");

        $response->assertRedirect();
        $response->assertSessionHasErrors();
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    // ===========================================
    // Toggle Actions Tests
    // ===========================================

    public function test_admin_can_toggle_product_featured(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'is_featured' => false,
        ]);

        $response = $this->actingAs($admin)->patch("/admin/products/{$product->id}/toggle-featured");

        $response->assertRedirect();
        $product->refresh();
        $this->assertTrue($product->is_featured);
    }

    public function test_admin_can_toggle_product_active(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->patch("/admin/products/{$product->id}/toggle-active");

        $response->assertRedirect();
        $product->refresh();
        $this->assertFalse($product->is_active);
    }

    // ===========================================
    // Bulk Actions Tests
    // ===========================================

    public function test_admin_can_bulk_activate_products(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        $products = Product::factory()->count(3)->inactive()->create(['category_id' => $category->id]);

        $response = $this->actingAs($admin)->post('/admin/products/bulk-action', [
            'action' => 'activate',
            'product_ids' => $products->pluck('id')->toArray(),
        ]);

        $response->assertRedirect();
        foreach ($products as $product) {
            $product->refresh();
            $this->assertTrue($product->is_active);
        }
    }

    public function test_admin_can_bulk_deactivate_products(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        $products = Product::factory()->count(3)->create(['category_id' => $category->id, 'is_active' => true]);

        $response = $this->actingAs($admin)->post('/admin/products/bulk-action', [
            'action' => 'deactivate',
            'product_ids' => $products->pluck('id')->toArray(),
        ]);

        $response->assertRedirect();
        foreach ($products as $product) {
            $product->refresh();
            $this->assertFalse($product->is_active);
        }
    }

    public function test_admin_can_bulk_feature_products(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        $products = Product::factory()->count(3)->create([
            'category_id' => $category->id,
            'is_featured' => false,
        ]);

        $response = $this->actingAs($admin)->post('/admin/products/bulk-action', [
            'action' => 'feature',
            'product_ids' => $products->pluck('id')->toArray(),
        ]);

        $response->assertRedirect();
        foreach ($products as $product) {
            $product->refresh();
            $this->assertTrue($product->is_featured);
        }
    }

    public function test_admin_can_bulk_delete_products(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        $products = Product::factory()->count(3)->create(['category_id' => $category->id]);
        $ids = $products->pluck('id')->toArray();

        $response = $this->actingAs($admin)->post('/admin/products/bulk-action', [
            'action' => 'delete',
            'product_ids' => $ids,
        ]);

        $response->assertRedirect();
        foreach ($ids as $id) {
            $this->assertDatabaseMissing('products', ['id' => $id]);
        }
    }

    public function test_bulk_action_validates_product_ids(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/products/bulk-action', [
            'action' => 'activate',
            'product_ids' => [],
        ]);

        $response->assertSessionHasErrors(['product_ids']);
    }

    // ===========================================
    // Duplicate Product Tests
    // ===========================================

    public function test_admin_can_view_create_with_duplicate(): void
    {
        $admin = $this->createAdmin();
        $category = Category::factory()->create();
        /** @var Product $product */
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Original Product',
            'price' => 100,
        ]);

        $response = $this->actingAs($admin)->get("/admin/products/create?duplicate={$product->id}");

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Products/Create')
                ->has('duplicateProduct')
                ->where('duplicateProduct.name', 'Original Product (Copy)')
            );
    }
}
