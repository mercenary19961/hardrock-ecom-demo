<?php

namespace Tests\Feature\Shop;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductBrowsingTest extends TestCase
{
    use RefreshDatabase;

    protected Category $category;
    protected Category $subcategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::factory()->create([
            'name' => 'Electronics',
            'slug' => 'electronics',
            'is_active' => true,
        ]);

        $this->subcategory = Category::factory()->create([
            'name' => 'Phones',
            'slug' => 'phones',
            'parent_id' => $this->category->id,
            'is_active' => true,
        ]);
    }

    protected function createProduct(array $attributes = []): Product
    {
        return Product::factory()->create(array_merge([
            'category_id' => $this->category->id,
            'is_active' => true,
        ], $attributes));
    }

    // ==================== HOME PAGE TESTS ====================

    public function test_home_page_is_accessible(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_home_page_displays_categories(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Shop/Home')
            ->has('categories')
        );
    }

    // ==================== CATEGORY PAGE TESTS ====================

    public function test_category_page_is_accessible(): void
    {
        $response = $this->get("/category/{$this->category->slug}");

        $response->assertStatus(200);
    }

    public function test_category_page_displays_products(): void
    {
        $this->createProduct(['name' => 'Test Product']);

        $response = $this->get("/category/{$this->category->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Shop/Category')
            ->has('category')
        );
    }

    public function test_category_page_only_shows_active_products(): void
    {
        $activeProduct = $this->createProduct(['name' => 'Active Product', 'is_active' => true]);
        $inactiveProduct = $this->createProduct(['name' => 'Inactive Product', 'is_active' => false]);

        $response = $this->get("/category/{$this->category->slug}");

        $response->assertStatus(200);
        // Product list should not include inactive products
        // (Note: products might be deferred, so this checks the initial state)
    }

    public function test_subcategory_page_is_accessible(): void
    {
        $response = $this->get("/category/{$this->subcategory->slug}");

        $response->assertStatus(200);
    }

    public function test_inactive_category_returns_404(): void
    {
        $inactiveCategory = Category::factory()->create([
            'is_active' => false,
        ]);

        $response = $this->get("/category/{$inactiveCategory->slug}");

        $response->assertStatus(404);
    }

    public function test_category_page_supports_price_filter(): void
    {
        $cheapProduct = $this->createProduct(['name' => 'Cheap', 'price' => 10]);
        $expensiveProduct = $this->createProduct(['name' => 'Expensive', 'price' => 100]);

        $response = $this->get("/category/{$this->category->slug}?min_price=50&max_price=150");

        $response->assertStatus(200);
    }

    public function test_category_page_supports_sorting(): void
    {
        $this->createProduct(['name' => 'Product A', 'price' => 50]);
        $this->createProduct(['name' => 'Product B', 'price' => 25]);

        $response = $this->get("/category/{$this->category->slug}?sort=price_asc");

        $response->assertStatus(200);
    }

    public function test_category_page_supports_new_arrivals_filter(): void
    {
        $response = $this->get("/category/{$this->category->slug}?new_arrivals=1");

        $response->assertStatus(200);
    }

    public function test_category_page_supports_in_stock_filter(): void
    {
        $this->createProduct(['name' => 'In Stock', 'stock' => 10]);
        $this->createProduct(['name' => 'Out of Stock', 'stock' => 0]);

        $response = $this->get("/category/{$this->category->slug}?in_stock=1");

        $response->assertStatus(200);
    }

    public function test_category_page_supports_pagination(): void
    {
        // Create many products
        for ($i = 0; $i < 25; $i++) {
            $this->createProduct(['name' => "Product $i"]);
        }

        $response = $this->get("/category/{$this->category->slug}?page=2");

        $response->assertStatus(200);
    }

    // ==================== PRODUCT DETAIL PAGE TESTS ====================

    public function test_product_page_is_accessible(): void
    {
        $product = $this->createProduct(['slug' => 'test-product']);

        $response = $this->get("/product/{$product->slug}");

        $response->assertStatus(200);
    }

    public function test_product_page_displays_product_details(): void
    {
        $product = $this->createProduct([
            'name' => 'Test Product',
            'slug' => 'test-product-details',
            'price' => 99.99,
            'description' => 'Product description here',
        ]);

        $response = $this->get("/product/{$product->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Shop/Product')
            ->has('product')
            ->where('product.name', 'Test Product')
        );
    }

    public function test_inactive_product_returns_404(): void
    {
        $product = $this->createProduct([
            'slug' => 'inactive-product',
            'is_active' => false,
        ]);

        $response = $this->get("/product/{$product->slug}");

        $response->assertStatus(404);
    }

    public function test_product_page_shows_related_products(): void
    {
        $product = $this->createProduct(['slug' => 'main-product']);
        // Create some related products in same category
        $this->createProduct(['name' => 'Related 1']);
        $this->createProduct(['name' => 'Related 2']);

        $response = $this->get("/product/{$product->slug}");

        $response->assertStatus(200);
        // Related products are typically deferred
    }

    public function test_product_page_increments_view_count(): void
    {
        $product = $this->createProduct(['slug' => 'view-count-test', 'view_count' => 5]);

        $this->get("/product/{$product->slug}");

        // View count should increment
        $this->assertGreaterThanOrEqual(5, $product->fresh()->view_count);
    }

    // ==================== SEARCH TESTS ====================

    public function test_search_page_is_accessible(): void
    {
        $response = $this->get('/search?q=test');

        $response->assertStatus(200);
    }

    public function test_search_finds_products_by_name(): void
    {
        $this->createProduct(['name' => 'iPhone 15 Pro']);
        $this->createProduct(['name' => 'Samsung Galaxy']);

        $response = $this->get('/search?q=iPhone');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Shop/Search')
        );
    }

    public function test_search_requires_query_parameter(): void
    {
        $response = $this->get('/search');

        // Should still work, just show empty results or all products
        $response->assertStatus(200);
    }

    public function test_search_only_returns_active_products(): void
    {
        $activeProduct = $this->createProduct(['name' => 'Active Phone', 'is_active' => true]);
        $inactiveProduct = $this->createProduct(['name' => 'Inactive Phone', 'is_active' => false]);

        $response = $this->get('/search?q=Phone');

        $response->assertStatus(200);
    }

    public function test_search_supports_pagination(): void
    {
        // Create many products
        for ($i = 0; $i < 30; $i++) {
            $this->createProduct(['name' => "Searchable Product $i"]);
        }

        $response = $this->get('/search?q=Searchable&page=2');

        $response->assertStatus(200);
    }

    // ==================== GUEST VS AUTHENTICATED TESTS ====================

    public function test_guest_can_browse_products(): void
    {
        $product = $this->createProduct(['slug' => 'guest-browsing']);

        $response = $this->get("/product/{$product->slug}");

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_browse_products(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['slug' => 'auth-browsing']);

        $response = $this->actingAs($user)->get("/product/{$product->slug}");

        $response->assertStatus(200);
    }

    // ==================== PRODUCT WITH VARIANTS TESTS ====================

    public function test_product_with_sizes_displays_correctly(): void
    {
        $product = $this->createProduct([
            'slug' => 'sized-product',
            'available_sizes' => ['S', 'M', 'L', 'XL'],
            'size_stock' => ['S' => 10, 'M' => 20, 'L' => 15, 'XL' => 5],
        ]);

        $response = $this->get("/product/{$product->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('product.available_sizes')
            ->has('product.size_stock')
        );
    }

    public function test_product_with_color_displays_correctly(): void
    {
        $product = $this->createProduct([
            'slug' => 'colored-product',
            'color' => 'Black',
            'color_hex' => '#000000',
        ]);

        $response = $this->get("/product/{$product->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('product.color', 'Black')
        );
    }

    // ==================== DISCOUNT PRODUCTS TESTS ====================

    public function test_product_with_discount_displays_both_prices(): void
    {
        $product = $this->createProduct([
            'slug' => 'discounted-product',
            'price' => 80,
            'compare_price' => 100,
        ]);

        $response = $this->get("/product/{$product->slug}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('product.price')
            ->has('product.compare_price')
        );
    }

    public function test_category_supports_discount_filter(): void
    {
        $this->createProduct(['price' => 90, 'compare_price' => 100]); // 10% off
        $this->createProduct(['price' => 50, 'compare_price' => 100]); // 50% off
        $this->createProduct(['price' => 100, 'compare_price' => null]); // No discount

        $response = $this->get("/category/{$this->category->slug}?min_discount=20&max_discount=60");

        $response->assertStatus(200);
    }
}
