<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\AuthorizationController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReportsController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\SearchController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\TeamController;
use App\Http\Controllers\Admin\UndoController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

// All staff (admin + editor)
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('search', [SearchController::class, 'search'])->name('search');

    // Products
    Route::resource('products', ProductController::class)->except(['show'])->scoped(['product' => 'id']);
    Route::get('products/export', [ProductController::class, 'export'])->name('products.export')->middleware('permission:orders.export');
    Route::post('products/bulk-action', [ProductController::class, 'bulkAction'])->name('products.bulk-action');
    Route::patch('products/{product:id}/toggle-featured', [ProductController::class, 'toggleFeatured'])->name('products.toggle-featured');
    Route::patch('products/{product:id}/toggle-active', [ProductController::class, 'toggleActive'])->name('products.toggle-active');
    Route::post('products/{product:id}/restore-activity/{activityLog}', [ProductController::class, 'restoreFromActivity'])->name('products.restore-activity');

    // Categories
    Route::resource('categories', CategoryController::class)->scoped(['category' => 'id']);

    // Orders
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/export', [OrderController::class, 'export'])->name('orders.export')->middleware('permission:orders.export');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('orders/{order}/invoice', [OrderController::class, 'printInvoice'])->name('orders.invoice');
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
    Route::patch('orders/{order}/tracking', [OrderController::class, 'updateTracking'])->name('orders.tracking');
    Route::get('orders/{order}/shipping-options', [OrderController::class, 'shippingOptions'])->name('orders.shipping-options');
    Route::post('orders/{order}/shipment', [OrderController::class, 'createShipment'])->name('orders.shipment.create');
    Route::delete('orders/{order}/shipment', [OrderController::class, 'cancelShipment'])->name('orders.shipment.cancel');
    Route::patch('orders/{order}/admin-notes', [OrderController::class, 'updateAdminNotes'])->name('orders.admin-notes');
    Route::post('orders/bulk-status', [OrderController::class, 'bulkUpdateStatus'])->name('orders.bulk-status');

    // Coupons
    Route::resource('coupons', CouponController::class)->except(['show']);
    Route::patch('coupons/{coupon}/toggle-active', [CouponController::class, 'toggleActive'])->name('coupons.toggle-active');

    // Reviews
    Route::get('reviews', [ReviewController::class, 'index'])->name('reviews.index');
    Route::get('reviews/{review}', [ReviewController::class, 'show'])->name('reviews.show');
    Route::delete('reviews/{review}', [ReviewController::class, 'destroy'])->name('reviews.destroy')->middleware('permission:reviews.delete');
    Route::post('reviews/bulk-delete', [ReviewController::class, 'bulkDelete'])->name('reviews.bulk-delete')->middleware('permission:reviews.delete');

    // Customers (separated from staff)
    Route::get('customers/export', [UserController::class, 'export'])->name('customers.export')->middleware('permission:customers.view');
    Route::resource('customers', UserController::class)->except(['create', 'store'])->middleware('permission:customers.view');
    Route::post('customers/{user}/send-reset-email', [UserController::class, 'sendResetEmail'])
        ->middleware(['throttle:10,60', 'permission:customers.edit'])
        ->name('customers.send-reset-email');
    Route::post('customers/{user}/send-verification-email', [UserController::class, 'sendVerificationEmail'])
        ->middleware(['throttle:10,60', 'permission:customers.edit'])
        ->name('customers.send-verification-email');

    // Reports
    Route::get('reports', [ReportsController::class, 'index'])->name('reports.index');

    // Activity log
    Route::get('activity-log', [ActivityLogController::class, 'index'])->name('activity-log.index');
    Route::post('activity-log/{activityLog}/revert', [ActivityLogController::class, 'revert'])->name('activity-log.revert');
    Route::delete('activity-log/{activityLog}', [ActivityLogController::class, 'destroy'])->name('activity-log.destroy')->middleware('permission:activity_log.delete');

    // Undo system
    Route::get('undo/{model}/{id}', [UndoController::class, 'status'])->name('undo.status');
    Route::post('undo/{model}/{id}', [UndoController::class, 'restore'])->name('undo.restore');
    Route::delete('undo/{model}/{id}', [UndoController::class, 'clear'])->name('undo.clear');

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::get('notifications/preferences', [NotificationController::class, 'preferences'])->name('notifications.preferences');
    Route::put('notifications/preferences', [NotificationController::class, 'updatePreferences'])->name('notifications.preferences.update');
});

// Admin-only routes
Route::middleware(['auth', 'admin:admin'])->prefix('admin')->name('admin.')->group(function () {
    // Team management (create/manage editors)
    Route::resource('team', TeamController::class)->except(['show']);

    // Authorization (per-editor permissions)
    Route::get('authorization', [AuthorizationController::class, 'index'])->name('authorization.index');
    Route::put('authorization/{user}', [AuthorizationController::class, 'update'])->name('authorization.update');

    // Settings (admin only)
    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');

    // Legacy users routes (redirects kept for backward compat)
    Route::get('users/export', [UserController::class, 'export'])->name('users.export');
    Route::resource('users', UserController::class)->except(['create', 'store']);
    Route::post('users/{user}/send-reset-email', [UserController::class, 'sendResetEmail'])
        ->middleware('throttle:10,60')->name('users.send-reset-email');
    Route::post('users/{user}/send-verification-email', [UserController::class, 'sendVerificationEmail'])
        ->middleware('throttle:10,60')->name('users.send-verification-email');
});
