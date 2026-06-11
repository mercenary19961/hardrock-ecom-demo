<?php

namespace Tests\Feature\Shop;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function createCartWithItems(User $user, array $items = []): Cart
    {
        $cart = Cart::create(['user_id' => $user->id]);
        $category = Category::factory()->create();

        if (empty($items)) {
            $product = Product::factory()->create([
                'category_id' => $category->id,
                'price' => 50,
                'stock' => 10,
            ]);
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => 2,
            ]);
        } else {
            foreach ($items as $item) {
                $product = Product::factory()->create([
                    'category_id' => $category->id,
                    'price' => $item['price'] ?? 50,
                    'stock' => $item['stock'] ?? 10,
                ]);
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'] ?? 1,
                ]);
            }
        }

        return $cart;
    }

    private function getValidCheckoutData(): array
    {
        return [
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_phone' => '+962791234567',
            'delivery_area' => 'Amman',
            'delivery_street' => '123 Main Street',
            'delivery_building' => 'Building 45',
            'delivery_notes' => 'Near the mall',
            'notes' => 'Please call before delivery',
        ];
    }

    // ===========================================
    // Checkout Page Tests
    // ===========================================

    public function test_guest_cannot_access_checkout(): void
    {
        $response = $this->get('/checkout');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_checkout(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user);

        $response = $this->actingAs($user)->get('/checkout');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Shop/Checkout')
                ->has('cart')
                ->has('user')
            );
    }

    public function test_checkout_page_shows_cart_data(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [
            ['price' => 25, 'quantity' => 2],
            ['price' => 50, 'quantity' => 1],
        ]);

        $response = $this->actingAs($user)->get('/checkout');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Shop/Checkout')
                ->has('cart.items', 2)
            );
    }

    public function test_checkout_page_shows_applied_coupon(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user);

        Coupon::factory()->percentage(10)->create(['code' => 'CHECKOUT']);

        // Apply coupon first
        $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'CHECKOUT']);

        $response = $this->actingAs($user)->get('/checkout');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Shop/Checkout')
                ->has('appliedCoupon')
                ->where('appliedCoupon.code', 'CHECKOUT')
            );
    }

    public function test_checkout_page_shows_stock_errors(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'price' => 50,
            'stock' => 2, // Only 2 in stock
        ]);

        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 5, // Requesting 5
        ]);

        $response = $this->actingAs($user)->get('/checkout');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Shop/Checkout')
                ->has('stockErrors')
            );
    }

    // ===========================================
    // Place Order Tests
    // ===========================================

    public function test_guest_cannot_place_order(): void
    {
        $response = $this->post('/checkout', $this->getValidCheckoutData());

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_place_order(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 50, 'quantity' => 2, 'stock' => 10]]);

        $response = $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
        ]);
    }

    public function test_order_creates_order_items(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [
            ['price' => 25, 'quantity' => 2, 'stock' => 10],
            ['price' => 50, 'quantity' => 1, 'stock' => 10],
        ]);

        $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        /** @var Order $order */
        $order = Order::where('user_id', $user->id)->first();
        $this->assertNotNull($order);
        $this->assertCount(2, $order->items);
    }

    public function test_order_decrements_product_stock(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'price' => 50,
            'stock' => 10,
        ]);

        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 3,
        ]);

        $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        $product->refresh();
        $this->assertEquals(7, $product->stock);
    }

    public function test_order_clears_cart_after_checkout(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $cart = $this->createCartWithItems($user);

        $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        $cart->refresh();
        $this->assertCount(0, $cart->items);
    }

    public function test_order_applies_coupon_discount(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 100, 'quantity' => 1, 'stock' => 10]]);

        Coupon::factory()->percentage(20)->create(['code' => 'SAVE20']);
        $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'SAVE20']);

        $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        /** @var Order $order */
        $order = Order::where('user_id', $user->id)->first();
        $this->assertEquals(20, (float) $order->discount);
        $this->assertEquals('SAVE20', $order->coupon_code);
    }

    public function test_order_increments_coupon_usage(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 100, 'quantity' => 1, 'stock' => 10]]);

        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['code' => 'COUNTME', 'usage_count' => 5]);
        $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'COUNTME']);

        $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        $coupon->refresh();
        $this->assertEquals(6, $coupon->usage_count);
    }

    public function test_order_clears_applied_coupon_from_session(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 100, 'quantity' => 1, 'stock' => 10]]);

        Coupon::factory()->create(['code' => 'CLEARME']);
        $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'CLEARME']);

        $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        $response = $this->actingAs($user)->getJson('/coupon/current');
        $response->assertJson(['coupon' => null]);
    }

    public function test_order_fails_with_insufficient_stock(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'price' => 50,
            'stock' => 1, // Only 1 in stock
        ]);

        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 5, // Requesting 5
        ]);

        $response = $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        $response->assertRedirect();
        $response->assertSessionHasErrors();
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_order_generates_unique_order_number(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 50, 'quantity' => 1, 'stock' => 10]]);

        $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        /** @var Order $order */
        $order = Order::where('user_id', $user->id)->first();
        $this->assertNotNull($order->order_number);
        $this->assertStringStartsWith('HR-', $order->order_number);
    }

    public function test_order_stores_shipping_address(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 50, 'quantity' => 1, 'stock' => 10]]);

        $this->actingAs($user)->post('/checkout', $this->getValidCheckoutData());

        /** @var Order $order */
        $order = Order::where('user_id', $user->id)->first();
        $this->assertEquals('Amman', $order->shipping_address['area']);
        $this->assertEquals('123 Main Street', $order->shipping_address['street']);
        $this->assertEquals('Building 45', $order->shipping_address['building']);
    }

    // ===========================================
    // Checkout Validation Tests
    // ===========================================

    public function test_checkout_requires_customer_name(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user);

        $data = $this->getValidCheckoutData();
        unset($data['customer_name']);

        $response = $this->actingAs($user)->post('/checkout', $data);

        $response->assertSessionHasErrors(['customer_name']);
    }

    public function test_checkout_allows_missing_email_and_falls_back_to_user(): void
    {
        // The simplified checkout form collects name/phone/area only; email is
        // optional and falls back to the authenticated user's email.
        /** @var User $user */
        $user = User::factory()->create(['email' => 'fallback@example.com']);
        $this->createCartWithItems($user, [['price' => 50, 'quantity' => 1, 'stock' => 10]]);

        $data = $this->getValidCheckoutData();
        unset($data['customer_email']);

        $response = $this->actingAs($user)->post('/checkout', $data);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'customer_email' => 'fallback@example.com',
        ]);
    }

    public function test_checkout_requires_valid_email(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user);

        $data = $this->getValidCheckoutData();
        $data['customer_email'] = 'not-an-email';

        $response = $this->actingAs($user)->post('/checkout', $data);

        $response->assertSessionHasErrors(['customer_email']);
    }

    public function test_checkout_requires_customer_phone(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user);

        $data = $this->getValidCheckoutData();
        unset($data['customer_phone']);

        $response = $this->actingAs($user)->post('/checkout', $data);

        $response->assertSessionHasErrors(['customer_phone']);
    }

    public function test_checkout_requires_delivery_area(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user);

        $data = $this->getValidCheckoutData();
        unset($data['delivery_area']);

        $response = $this->actingAs($user)->post('/checkout', $data);

        $response->assertSessionHasErrors(['delivery_area']);
    }

    public function test_checkout_allows_missing_delivery_street(): void
    {
        // Street/building are optional in the simplified form (area is required).
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 50, 'quantity' => 1, 'stock' => 10]]);

        $data = $this->getValidCheckoutData();
        unset($data['delivery_street']);

        $response = $this->actingAs($user)->post('/checkout', $data);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
    }

    public function test_checkout_allows_missing_delivery_building(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 50, 'quantity' => 1, 'stock' => 10]]);

        $data = $this->getValidCheckoutData();
        unset($data['delivery_building']);

        $response = $this->actingAs($user)->post('/checkout', $data);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
    }

    public function test_checkout_allows_optional_notes(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 50, 'quantity' => 1, 'stock' => 10]]);

        $data = $this->getValidCheckoutData();
        unset($data['notes']);
        unset($data['delivery_notes']);

        $response = $this->actingAs($user)->post('/checkout', $data);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    // ===========================================
    // WhatsApp Order Tests
    // ===========================================

    public function test_guest_cannot_place_whatsapp_order(): void
    {
        $response = $this->postJson('/checkout/whatsapp', [
            'customer_name' => 'John',
            'customer_phone' => '+962791234567',
            'delivery_area' => 'Amman',
        ]);

        $response->assertUnauthorized();
    }

    public function test_whatsapp_order_creates_order(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, [['price' => 50, 'quantity' => 1, 'stock' => 10]]);

        $response = $this->actingAs($user)->postJson('/checkout/whatsapp', [
            'customer_name' => 'John Doe',
            'customer_phone' => '+962791234567',
            'delivery_area' => 'Amman',
        ]);

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['order_number', 'order_id']);
    }

    public function test_whatsapp_order_validates_required_fields(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user);

        $response = $this->actingAs($user)->postJson('/checkout/whatsapp', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_name', 'customer_phone', 'delivery_area']);
    }
}
