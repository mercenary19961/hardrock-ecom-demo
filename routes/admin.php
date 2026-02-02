<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReportsController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\SearchController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UndoController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Global search
    Route::get('search', [SearchController::class, 'search'])->name('search');

    // Use 'id' for route model binding in admin panel (Category model uses 'slug' by default for frontend)
    Route::resource('categories', CategoryController::class)->scoped(['category' => 'id']);
    Route::resource('products', ProductController::class)->except(['show'])->scoped(['product' => 'id']);
    Route::get('products/export', [ProductController::class, 'export'])->name('products.export');
    Route::post('products/bulk-action', [ProductController::class, 'bulkAction'])->name('products.bulk-action');
    Route::patch('products/{product:id}/toggle-featured', [ProductController::class, 'toggleFeatured'])->name('products.toggle-featured');
    Route::patch('products/{product:id}/toggle-active', [ProductController::class, 'toggleActive'])->name('products.toggle-active');
    Route::post('products/{product:id}/restore-activity/{activityLog}', [ProductController::class, 'restoreFromActivity'])->name('products.restore-activity');

    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/export', [OrderController::class, 'export'])->name('orders.export');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('orders/{order}/invoice', [OrderController::class, 'printInvoice'])->name('orders.invoice');
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
    Route::patch('orders/{order}/tracking', [OrderController::class, 'updateTracking'])->name('orders.tracking');
    Route::patch('orders/{order}/admin-notes', [OrderController::class, 'updateAdminNotes'])->name('orders.admin-notes');
    Route::post('orders/bulk-status', [OrderController::class, 'bulkUpdateStatus'])->name('orders.bulk-status');

    // Coupons management
    Route::resource('coupons', CouponController::class)->except(['show']);
    Route::patch('coupons/{coupon}/toggle-active', [CouponController::class, 'toggleActive'])->name('coupons.toggle-active');

    // Reviews management (read-only with delete capability)
    Route::get('reviews', [ReviewController::class, 'index'])->name('reviews.index');
    Route::get('reviews/{review}', [ReviewController::class, 'show'])->name('reviews.show');
    Route::delete('reviews/{review}', [ReviewController::class, 'destroy'])->name('reviews.destroy');
    Route::post('reviews/bulk-delete', [ReviewController::class, 'bulkDelete'])->name('reviews.bulk-delete');

    // Users management (roles are immutable, only customers can be deleted)
    Route::resource('users', UserController::class)->except(['create', 'store']);
    // Rate limit email sending to prevent spam (10 per hour per admin)
    Route::post('users/{user}/send-reset-email', [UserController::class, 'sendResetEmail'])
        ->middleware('throttle:10,60')
        ->name('users.send-reset-email');
    Route::post('users/{user}/send-verification-email', [UserController::class, 'sendVerificationEmail'])
        ->middleware('throttle:10,60')
        ->name('users.send-verification-email');

    // Settings management
    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');

    // Reports
    Route::get('reports', [ReportsController::class, 'index'])->name('reports.index');

    // Undo system routes
    Route::get('undo/{model}/{id}', [UndoController::class, 'status'])->name('undo.status');
    Route::post('undo/{model}/{id}', [UndoController::class, 'restore'])->name('undo.restore');
    Route::delete('undo/{model}/{id}', [UndoController::class, 'clear'])->name('undo.clear');
});
