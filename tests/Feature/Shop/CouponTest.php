<?php

namespace Tests\Feature\Shop;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    private function createCartWithItems(User $user, float $subtotal = 100): Cart
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'price' => $subtotal,
            'stock' => 10,
        ]);

        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
        ]);

        return $cart;
    }

    // ===========================================
    // Apply Coupon Tests
    // ===========================================

    public function test_guest_can_apply_valid_coupon(): void
    {
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->percentage(10)->create(['code' => 'SAVE10']);

        $response = $this->postJson('/coupon/apply', ['code' => 'SAVE10']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => [
                    'code' => 'SAVE10',
                    'type' => 'percentage',
                    'value' => 10,
                ],
            ]);
    }

    public function test_coupon_code_is_case_insensitive(): void
    {
        Coupon::factory()->create(['code' => 'DISCOUNT']);

        $response = $this->postJson('/coupon/apply', ['code' => 'discount']);

        $response->assertOk()
            ->assertJson(['success' => true]);
    }

    public function test_apply_invalid_coupon_returns_not_found(): void
    {
        $response = $this->postJson('/coupon/apply', ['code' => 'INVALID']);

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
                'error' => 'coupon_not_found',
            ]);
    }

    public function test_apply_inactive_coupon_fails(): void
    {
        Coupon::factory()->inactive()->create(['code' => 'INACTIVE']);

        $response = $this->postJson('/coupon/apply', ['code' => 'INACTIVE']);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'coupon_inactive',
            ]);
    }

    public function test_apply_expired_coupon_fails(): void
    {
        Coupon::factory()->expired()->create(['code' => 'EXPIRED']);

        $response = $this->postJson('/coupon/apply', ['code' => 'EXPIRED']);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'coupon_expired',
            ]);
    }

    public function test_apply_not_yet_started_coupon_fails(): void
    {
        Coupon::factory()->notYetStarted()->create(['code' => 'FUTURE']);

        $response = $this->postJson('/coupon/apply', ['code' => 'FUTURE']);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'coupon_not_started',
            ]);
    }

    public function test_apply_exhausted_coupon_fails(): void
    {
        Coupon::factory()->exhausted()->create(['code' => 'USED']);

        $response = $this->postJson('/coupon/apply', ['code' => 'USED']);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'coupon_exhausted',
            ]);
    }

    public function test_apply_coupon_below_minimum_order_fails(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, 30);

        Coupon::factory()->withMinOrder(50)->create(['code' => 'MINORDER']);

        $response = $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'MINORDER']);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'coupon_min_order',
            ]);
    }

    public function test_apply_coupon_exceeding_per_user_limit_fails(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->withUserLimit(1)->create(['code' => 'ONCE']);

        // Attach user to coupon with usage_count = 1
        $coupon->users()->attach($user->id, ['usage_count' => 1]);

        $response = $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'ONCE']);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'coupon_user_limit',
            ]);
    }

    public function test_percentage_coupon_calculates_discount_correctly(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, 100);

        Coupon::factory()->percentage(20)->create(['code' => 'PERCENT20']);

        $response = $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'PERCENT20']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => [
                    'discount' => 20,
                ],
            ]);
    }

    public function test_percentage_coupon_respects_max_discount(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, 200);

        Coupon::factory()
            ->percentage(20)
            ->withMaxDiscount(30)
            ->create(['code' => 'CAPPED']);

        $response = $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'CAPPED']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => [
                    'discount' => 30, // Max discount, not 40 (20% of 200)
                ],
            ]);
    }

    public function test_fixed_coupon_calculates_discount_correctly(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, 100);

        Coupon::factory()->fixed(15)->create(['code' => 'FLAT15']);

        $response = $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'FLAT15']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => [
                    'discount' => 15,
                ],
            ]);
    }

    public function test_fixed_coupon_does_not_exceed_cart_total(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, 10);

        Coupon::factory()->fixed(50)->create(['code' => 'BIG']);

        $response = $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'BIG']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => [
                    'discount' => 10, // Capped to cart total
                ],
            ]);
    }

    public function test_apply_coupon_code_is_required(): void
    {
        $response = $this->postJson('/coupon/apply', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    // ===========================================
    // Remove Coupon Tests
    // ===========================================

    public function test_remove_coupon_clears_session(): void
    {
        Coupon::factory()->create(['code' => 'REMOVE']);

        // Apply coupon first
        $this->postJson('/coupon/apply', ['code' => 'REMOVE']);

        // Remove coupon
        $response = $this->postJson('/coupon/remove');

        $response->assertOk()
            ->assertJson(['success' => true]);

        // Verify it's gone
        $checkResponse = $this->getJson('/coupon/current');
        $checkResponse->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => null,
            ]);
    }

    // ===========================================
    // Get Current Coupon Tests
    // ===========================================

    public function test_get_current_coupon_returns_applied_coupon(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->createCartWithItems($user, 100);

        Coupon::factory()->percentage(10)->create(['code' => 'CURRENT']);

        $this->actingAs($user)->postJson('/coupon/apply', ['code' => 'CURRENT']);

        $response = $this->actingAs($user)->getJson('/coupon/current');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => [
                    'code' => 'CURRENT',
                ],
            ]);
    }

    public function test_get_current_coupon_returns_null_when_none_applied(): void
    {
        $response = $this->getJson('/coupon/current');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => null,
            ]);
    }

    public function test_get_current_coupon_removes_expired_coupon(): void
    {
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['code' => 'WILLEXPIRE']);

        // Apply the coupon
        $this->postJson('/coupon/apply', ['code' => 'WILLEXPIRE']);

        // Expire the coupon
        $coupon->update(['expires_at' => now()->subHour()]);

        // Check current - should auto-remove
        $response = $this->getJson('/coupon/current');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'coupon' => null,
            ]);
    }

    // ===========================================
    // List Available Coupons Tests
    // ===========================================

    public function test_list_available_coupons(): void
    {
        Coupon::factory()->create(['code' => 'ACTIVE1', 'value' => 20]);
        Coupon::factory()->create(['code' => 'ACTIVE2', 'value' => 10]);
        Coupon::factory()->inactive()->create(['code' => 'HIDDEN']);
        Coupon::factory()->expired()->create(['code' => 'EXPIRED']);

        $response = $this->getJson('/coupon/available');

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(2, 'coupons')
            ->assertJsonFragment(['code' => 'ACTIVE1'])
            ->assertJsonFragment(['code' => 'ACTIVE2'])
            ->assertJsonMissing(['code' => 'HIDDEN'])
            ->assertJsonMissing(['code' => 'EXPIRED']);
    }

    public function test_available_coupons_sorted_by_value_descending(): void
    {
        Coupon::factory()->create(['code' => 'LOW', 'value' => 5]);
        Coupon::factory()->create(['code' => 'HIGH', 'value' => 25]);
        Coupon::factory()->create(['code' => 'MID', 'value' => 15]);

        $response = $this->getJson('/coupon/available');

        $response->assertOk();
        $coupons = $response->json('coupons');
        $this->assertEquals('HIGH', $coupons[0]['code']);
        $this->assertEquals('MID', $coupons[1]['code']);
        $this->assertEquals('LOW', $coupons[2]['code']);
    }

    // ===========================================
    // Coupon Model Tests
    // ===========================================

    public function test_coupon_is_valid_method(): void
    {
        /** @var Coupon $validCoupon */
        $validCoupon = Coupon::factory()->create();
        $this->assertTrue($validCoupon->isValid());

        /** @var Coupon $inactiveCoupon */
        $inactiveCoupon = Coupon::factory()->inactive()->create();
        $this->assertFalse($inactiveCoupon->isValid());

        /** @var Coupon $expiredCoupon */
        $expiredCoupon = Coupon::factory()->expired()->create();
        $this->assertFalse($expiredCoupon->isValid());

        /** @var Coupon $exhaustedCoupon */
        $exhaustedCoupon = Coupon::factory()->exhausted()->create();
        $this->assertFalse($exhaustedCoupon->isValid());
    }

    public function test_coupon_increment_usage(): void
    {
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['usage_count' => 0]);
        /** @var User $user */
        $user = User::factory()->create();

        $coupon->incrementUsage($user);

        $coupon->refresh();
        $this->assertEquals(1, $coupon->usage_count);
        $this->assertEquals(1, $coupon->users()->where('user_id', $user->id)->first()->pivot->usage_count);
    }

    public function test_coupon_increment_usage_for_existing_user(): void
    {
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->create(['usage_count' => 0]);
        /** @var User $user */
        $user = User::factory()->create();

        // First usage
        $coupon->incrementUsage($user);
        // Second usage
        $coupon->incrementUsage($user);

        $coupon->refresh();
        $this->assertEquals(2, $coupon->usage_count);
        $this->assertEquals(2, $coupon->users()->where('user_id', $user->id)->first()->pivot->usage_count);
    }

    public function test_coupon_calculate_discount_percentage(): void
    {
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->percentage(15)->create();

        $this->assertEquals(15, $coupon->calculateDiscount(100));
        $this->assertEquals(7.5, $coupon->calculateDiscount(50));
    }

    public function test_coupon_calculate_discount_fixed(): void
    {
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->fixed(10)->create();

        $this->assertEquals(10, $coupon->calculateDiscount(100));
        $this->assertEquals(10, $coupon->calculateDiscount(50));
        $this->assertEquals(5, $coupon->calculateDiscount(5)); // Capped
    }

    public function test_coupon_meets_minimum_order(): void
    {
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->withMinOrder(50)->create();

        $this->assertTrue($coupon->meetsMinimumOrder(50));
        $this->assertTrue($coupon->meetsMinimumOrder(100));
        $this->assertFalse($coupon->meetsMinimumOrder(49.99));
    }

    public function test_coupon_can_be_used_by(): void
    {
        /** @var Coupon $coupon */
        $coupon = Coupon::factory()->withUserLimit(2)->create();
        /** @var User $user */
        $user = User::factory()->create();

        // User hasn't used it yet
        $this->assertTrue($coupon->canBeUsedBy($user));

        // Use it once
        $coupon->incrementUsage($user);
        $this->assertTrue($coupon->canBeUsedBy($user));

        // Use it twice (at limit)
        $coupon->incrementUsage($user);
        $this->assertFalse($coupon->canBeUsedBy($user));
    }
}
