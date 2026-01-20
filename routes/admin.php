<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\UndoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Use 'id' for route model binding in admin panel (Category model uses 'slug' by default for frontend)
    Route::resource('categories', CategoryController::class)->scoped(['category' => 'id']);
    Route::resource('products', ProductController::class)->except(['show'])->scoped(['product' => 'id']);

    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');

    // Undo system routes
    Route::get('undo/{model}/{id}', [UndoController::class, 'status'])->name('undo.status');
    Route::post('undo/{model}/{id}', [UndoController::class, 'restore'])->name('undo.restore');
    Route::delete('undo/{model}/{id}', [UndoController::class, 'clear'])->name('undo.clear');
});
