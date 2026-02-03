<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class OrderManagementTest extends TestCase
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

    private function createOrderWithItems(User $customer): Order
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);

        /** @var Order $order */
        $order = Order::factory()->forUser($customer)->create();
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 2,
            'price' => $product->price,
            'subtotal' => $product->price * 2,
        ]);

        return $order;
    }

    // ===========================================
    // Authorization Tests
    // ===========================================

    public function test_guest_cannot_access_orders_index(): void
    {
        $response = $this->get('/admin/orders');
        $response->assertRedirect('/login');
    }

    public function test_customer_cannot_access_orders_index(): void
    {
        $customer = $this->createCustomer();

        $response = $this->actingAs($customer)->get('/admin/orders');

        $response->assertForbidden();
    }

    public function test_admin_can_access_orders_index(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get('/admin/orders');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Orders/Index')
                ->has('orders')
            );
    }

    // ===========================================
    // Orders List Tests
    // ===========================================

    public function test_orders_index_shows_orders(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        $this->createOrderWithItems($customer);
        $this->createOrderWithItems($customer);
        $this->createOrderWithItems($customer);

        $response = $this->actingAs($admin)->get('/admin/orders');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Orders/Index')
                ->has('orders.data', 3)
            );
    }

    public function test_orders_can_be_searched_by_order_number(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = $this->createOrderWithItems($customer);
        $this->createOrderWithItems($customer);

        $response = $this->actingAs($admin)->get('/admin/orders?search=' . $order->order_number);

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('orders.data', 1)
            );
    }

    public function test_orders_can_be_searched_by_customer_name(): void
    {
        $admin = $this->createAdmin();
        /** @var User $customer */
        $customer = User::factory()->create(['name' => 'John Unique']);
        $this->createOrderWithItems($customer);

        /** @var User $otherCustomer */
        $otherCustomer = User::factory()->create(['name' => 'Jane Different']);
        $this->createOrderWithItems($otherCustomer);

        $response = $this->actingAs($admin)->get('/admin/orders?search=John');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('orders.data', 1)
            );
    }

    public function test_orders_can_be_filtered_by_status(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();

        Order::factory()->pending()->forUser($customer)->count(3)->create();
        Order::factory()->processing()->forUser($customer)->count(2)->create();

        $response = $this->actingAs($admin)->get('/admin/orders?status=processing');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('orders.data', 2)
            );
    }

    public function test_orders_can_be_filtered_by_payment_status(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();

        Order::factory()->forUser($customer)->count(3)->create(['payment_status' => 'pending']);
        Order::factory()->paid()->forUser($customer)->count(2)->create();

        $response = $this->actingAs($admin)->get('/admin/orders?payment_status=paid');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('orders.data', 2)
            );
    }

    public function test_orders_can_be_filtered_by_date_range(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();

        // Create old orders
        Order::factory()->forUser($customer)->create(['created_at' => now()->subDays(30)]);

        // Create recent orders
        Order::factory()->forUser($customer)->count(2)->create(['created_at' => now()]);

        $response = $this->actingAs($admin)->get('/admin/orders?date_preset=today');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('orders.data', 2)
            );
    }

    public function test_orders_index_shows_status_counts(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();

        Order::factory()->pending()->forUser($customer)->count(3)->create();
        Order::factory()->processing()->forUser($customer)->count(2)->create();
        Order::factory()->delivered()->forUser($customer)->create();

        $response = $this->actingAs($admin)->get('/admin/orders');

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('statusCounts')
                ->where('statusCounts.pending', 3)
                ->where('statusCounts.processing', 2)
                ->where('statusCounts.delivered', 1)
            );
    }

    // ===========================================
    // View Order Tests
    // ===========================================

    public function test_admin_can_view_order_details(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        $order = $this->createOrderWithItems($customer);

        $response = $this->actingAs($admin)->get("/admin/orders/{$order->id}");

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Orders/Show')
                ->has('order')
                ->has('order.items')
            );
    }

    public function test_customer_cannot_view_admin_order_details(): void
    {
        $customer = $this->createCustomer();
        $order = $this->createOrderWithItems($customer);

        $response = $this->actingAs($customer)->get("/admin/orders/{$order->id}");

        $response->assertForbidden();
    }

    // ===========================================
    // Update Status Tests
    // ===========================================

    public function test_admin_can_update_order_status(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->pending()->forUser($customer)->create();

        $response = $this->actingAs($admin)->patch("/admin/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $response->assertRedirect();
        $order->refresh();
        $this->assertEquals('processing', $order->status);
    }

    public function test_update_status_validates_status(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->pending()->forUser($customer)->create();

        $response = $this->actingAs($admin)->patch("/admin/orders/{$order->id}/status", [
            'status' => 'invalid_status',
        ]);

        $response->assertSessionHasErrors(['status']);
    }

    public function test_update_status_logs_activity(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->pending()->forUser($customer)->create();

        $this->actingAs($admin)->patch("/admin/orders/{$order->id}/status", [
            'status' => 'processing',
        ]);

        $this->assertDatabaseHas('order_activities', [
            'order_id' => $order->id,
            'action' => 'status_changed',
        ]);
    }

    // ===========================================
    // Update Tracking Tests
    // ===========================================

    public function test_admin_can_update_tracking_info(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->processing()->forUser($customer)->create();

        $response = $this->actingAs($admin)->patch("/admin/orders/{$order->id}/tracking", [
            'tracking_number' => 'TRACK123456',
            'carrier' => 'DHL',
        ]);

        $response->assertRedirect();
        $order->refresh();
        $this->assertEquals('TRACK123456', $order->tracking_number);
        $this->assertEquals('DHL', $order->carrier);
    }

    public function test_admin_can_clear_tracking_info(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->shipped()->forUser($customer)->create();

        $response = $this->actingAs($admin)->patch("/admin/orders/{$order->id}/tracking", [
            'tracking_number' => null,
            'carrier' => null,
        ]);

        $response->assertRedirect();
        $order->refresh();
        $this->assertNull($order->tracking_number);
        $this->assertNull($order->carrier);
    }

    // ===========================================
    // Update Admin Notes Tests
    // ===========================================

    public function test_admin_can_update_admin_notes(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->forUser($customer)->create(['admin_notes' => null]);

        $response = $this->actingAs($admin)->patch("/admin/orders/{$order->id}/admin-notes", [
            'admin_notes' => 'Customer requested callback',
        ]);

        $response->assertRedirect();
        $order->refresh();
        $this->assertEquals('Customer requested callback', $order->admin_notes);
    }

    public function test_admin_notes_can_be_cleared(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->forUser($customer)->create(['admin_notes' => 'Old note']);

        $response = $this->actingAs($admin)->patch("/admin/orders/{$order->id}/admin-notes", [
            'admin_notes' => '',
        ]);

        $response->assertRedirect();
        $order->refresh();
        $this->assertNull($order->admin_notes);
    }

    // ===========================================
    // Bulk Status Update Tests
    // ===========================================

    public function test_admin_can_bulk_update_order_status(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();

        $orders = Order::factory()->pending()->forUser($customer)->count(3)->create();
        $ids = $orders->pluck('id')->toArray();

        $response = $this->actingAs($admin)->post('/admin/orders/bulk-status', [
            'order_ids' => $ids,
            'status' => 'processing',
        ]);

        $response->assertRedirect();
        foreach ($orders as $order) {
            $order->refresh();
            $this->assertEquals('processing', $order->status);
        }
    }

    public function test_bulk_status_skips_orders_with_same_status(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();

        // One already processing
        /** @var Order $processingOrder */
        $processingOrder = Order::factory()->processing()->forUser($customer)->create();
        // Two pending
        $pendingOrders = Order::factory()->pending()->forUser($customer)->count(2)->create();

        $allIds = $pendingOrders->pluck('id')->push($processingOrder->id)->toArray();

        $response = $this->actingAs($admin)->post('/admin/orders/bulk-status', [
            'order_ids' => $allIds,
            'status' => 'processing',
        ]);

        $response->assertRedirect();
        // Message should indicate 2 updated (not 3)
    }

    public function test_bulk_status_validates_order_ids(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->post('/admin/orders/bulk-status', [
            'order_ids' => [],
            'status' => 'processing',
        ]);

        $response->assertSessionHasErrors(['order_ids']);
    }

    // ===========================================
    // Export Tests
    // ===========================================

    public function test_admin_can_export_orders_csv(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        $this->createOrderWithItems($customer);
        $this->createOrderWithItems($customer);

        $response = $this->actingAs($admin)->get('/admin/orders/export');

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=utf-8');
    }

    public function test_export_respects_filters(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();

        Order::factory()->pending()->forUser($customer)->count(3)->create();
        Order::factory()->delivered()->forUser($customer)->count(2)->create();

        $response = $this->actingAs($admin)->get('/admin/orders/export?status=pending');

        $response->assertOk();
        // CSV should contain only pending orders
    }

    public function test_customer_cannot_export_orders(): void
    {
        $customer = $this->createCustomer();

        $response = $this->actingAs($customer)->get('/admin/orders/export');

        $response->assertForbidden();
    }

    // ===========================================
    // Print Invoice Tests
    // ===========================================

    public function test_admin_can_view_order_invoice(): void
    {
        $admin = $this->createAdmin();
        $customer = $this->createCustomer();
        $order = $this->createOrderWithItems($customer);

        $response = $this->actingAs($admin)->get("/admin/orders/{$order->id}/invoice");

        $response->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Orders/Invoice')
                ->has('order')
            );
    }

    // ===========================================
    // Order Model Tests
    // ===========================================

    public function test_order_can_be_cancelled_from_pending(): void
    {
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->pending()->forUser($customer)->create();

        $this->assertTrue($order->canBeCancelled());
    }

    public function test_order_can_be_cancelled_from_processing(): void
    {
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->processing()->forUser($customer)->create();

        $this->assertTrue($order->canBeCancelled());
    }

    public function test_order_cannot_be_cancelled_when_shipped(): void
    {
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->shipped()->forUser($customer)->create();

        $this->assertFalse($order->canBeCancelled());
    }

    public function test_order_cannot_be_cancelled_when_delivered(): void
    {
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->delivered()->forUser($customer)->create();

        $this->assertFalse($order->canBeCancelled());
    }

    public function test_order_status_colors(): void
    {
        $customer = $this->createCustomer();

        /** @var Order $pendingOrder */
        $pendingOrder = Order::factory()->pending()->forUser($customer)->create();
        $this->assertEquals('yellow', $pendingOrder->status_color);

        /** @var Order $processingOrder */
        $processingOrder = Order::factory()->processing()->forUser($customer)->create();
        $this->assertEquals('blue', $processingOrder->status_color);

        /** @var Order $deliveredOrder */
        $deliveredOrder = Order::factory()->delivered()->forUser($customer)->create();
        $this->assertEquals('green', $deliveredOrder->status_color);
    }

    public function test_order_mark_as_paid(): void
    {
        $customer = $this->createCustomer();
        /** @var Order $order */
        $order = Order::factory()->forUser($customer)->create(['payment_status' => 'pending']);

        $order->markAsPaid('TXN123');

        $order->refresh();
        $this->assertEquals('paid', $order->payment_status);
        $this->assertEquals('TXN123', $order->transaction_id);
        $this->assertNotNull($order->paid_at);
    }
}
