<?php

namespace Tests\Feature\Shop;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::factory()->create();
    }

    protected function createProduct(array $attributes = []): Product
    {
        return Product::factory()->create(array_merge([
            'category_id' => $this->category->id,
        ], $attributes));
    }

    public function test_guest_can_view_cart_page(): void
    {
        $response = $this->get('/cart');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_view_cart_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/cart');

        $response->assertStatus(200);
    }

    public function test_guest_can_add_product_to_cart(): void
    {
        $product = $this->createProduct(['stock' => 10]);

        $response = $this->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response->assertRedirect();

        // Check cart was created with session_id
        $this->assertDatabaseHas('carts', [
            'user_id' => null,
        ]);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
    }

    public function test_authenticated_user_can_add_product_to_cart(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        $response = $this->actingAs($user)->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('carts', [
            'user_id' => $user->id,
        ]);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $product->id,
            'quantity' => 3,
        ]);
    }

    public function test_cannot_add_out_of_stock_product_to_cart(): void
    {
        $product = $this->createProduct(['stock' => 0]);

        $response = $this->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('cart_items', [
            'product_id' => $product->id,
        ]);
    }

    public function test_cannot_add_inactive_product_to_cart(): void
    {
        $product = $this->createProduct(['stock' => 10, 'is_active' => false]);

        $response = $this->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('cart_items', [
            'product_id' => $product->id,
        ]);
    }

    public function test_adding_same_product_increments_quantity(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        // Add product first time
        $this->actingAs($user)->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        // Add same product again
        $this->actingAs($user)->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        // Should have one item with quantity 5
        $cart = Cart::where('user_id', $user->id)->first();
        $this->assertCount(1, $cart->items);
        $this->assertEquals(5, $cart->items->first()->quantity);
    }

    public function test_same_product_with_different_variants_creates_separate_items(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        // Add product with size M
        $this->actingAs($user)->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 1,
            'size' => 'M',
            'color' => 'black',
        ]);

        // Add same product with size L
        $this->actingAs($user)->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 1,
            'size' => 'L',
            'color' => 'black',
        ]);

        // Should have two separate items
        $cart = Cart::where('user_id', $user->id)->first();
        $this->assertCount(2, $cart->items);
    }

    public function test_user_can_update_cart_item_quantity(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        // Create cart with item
        $cart = Cart::create(['user_id' => $user->id]);
        $item = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)->patch("/cart/{$item->id}", [
            'quantity' => 5,
        ]);

        $response->assertRedirect();
        $this->assertEquals(5, $item->fresh()->quantity);
    }

    public function test_setting_quantity_to_zero_removes_item(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        $cart = Cart::create(['user_id' => $user->id]);
        $item = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $this->actingAs($user)->patch("/cart/{$item->id}", [
            'quantity' => 0,
        ]);

        $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);
    }

    public function test_quantity_cannot_exceed_99(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 200]);

        $cart = Cart::create(['user_id' => $user->id]);
        $item = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 50,
        ]);

        $response = $this->actingAs($user)->patch("/cart/{$item->id}", [
            'quantity' => 100,
        ]);

        $response->assertSessionHasErrors('quantity');
    }

    public function test_user_can_remove_cart_item(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        $cart = Cart::create(['user_id' => $user->id]);
        $item = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)->delete("/cart/{$item->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('cart_items', ['id' => $item->id]);
    }

    public function test_user_cannot_modify_another_users_cart(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        // Create cart for user1
        $cart = Cart::create(['user_id' => $user1->id]);
        $item = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        // User2 tries to modify user1's cart
        $response = $this->actingAs($user2)->patch("/cart/{$item->id}", [
            'quantity' => 10,
        ]);

        $response->assertStatus(403);
        $this->assertEquals(2, $item->fresh()->quantity);
    }

    public function test_user_cannot_delete_another_users_cart_item(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        $cart = Cart::create(['user_id' => $user1->id]);
        $item = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user2)->delete("/cart/{$item->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('cart_items', ['id' => $item->id]);
    }

    public function test_cart_data_endpoint_returns_json(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 10, 'price' => 25.00]);

        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($user)->get('/cart/data');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'items' => [
                '*' => [
                    'id',
                    'quantity',
                    'subtotal',
                    'product' => [
                        'id',
                        'name',
                        'price',
                    ],
                ],
            ],
            'total_items',
            'subtotal',
        ]);
    }

    public function test_cart_calculates_correct_subtotal(): void
    {
        $user = User::factory()->create();
        $product1 = $this->createProduct(['stock' => 10, 'price' => 10.00]);
        $product2 = $this->createProduct(['stock' => 10, 'price' => 15.00]);

        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product1->id,
            'quantity' => 2, // 2 * 10 = 20
        ]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product2->id,
            'quantity' => 3, // 3 * 15 = 45
        ]);

        $response = $this->actingAs($user)->get('/cart/data');

        $data = $response->json();
        $this->assertEquals(5, $data['total_items']); // 2 + 3
        $this->assertEquals(65.00, $data['subtotal']); // 20 + 45
    }

    public function test_empty_cart_returns_zero_totals(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/cart/data');

        $response->assertStatus(200);
        $response->assertJson([
            'items' => [],
            'total_items' => 0,
            'subtotal' => 0,
        ]);
    }

    public function test_add_requires_valid_product_id(): void
    {
        $response = $this->post('/cart/add', [
            'product_id' => 99999,
            'quantity' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
    }

    public function test_quantity_must_be_positive_when_adding(): void
    {
        $product = $this->createProduct(['stock' => 10]);

        $response = $this->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 0,
        ]);

        $response->assertSessionHasErrors('quantity');
    }

    public function test_cart_item_tracks_selected_variant(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        $this->actingAs($user)->post('/cart/add', [
            'product_id' => $product->id,
            'quantity' => 1,
            'color' => 'red',
            'size' => 'XL',
        ]);

        $this->assertDatabaseHas('cart_items', [
            'product_id' => $product->id,
            'color' => 'red',
            'size' => 'XL',
        ]);
    }
}
