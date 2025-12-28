<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\CategoryController;
use App\Http\Controllers\Shop\CheckoutController;
use App\Http\Controllers\Shop\HomeController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\ProductController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Shop routes
Route::name('shop.')->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('home');
    Route::get('/category/{category:slug}', [CategoryController::class, 'show'])->name('category');
    Route::get('/product/{product:slug}', [ProductController::class, 'show'])->name('product');
    Route::get('/search', [ProductController::class, 'search'])->name('search');

    // Cart routes
    Route::get('/cart', [CartController::class, 'index'])->name('cart');
    Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
    Route::patch('/cart/{item}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{item}', [CartController::class, 'remove'])->name('cart.remove');
    Route::get('/cart/data', [CartController::class, 'data'])->name('cart.data');

    // Checkout routes
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');

    // Order confirmation (accessible to anyone who just placed an order)
    Route::get('/order/{order}/confirmation', [OrderController::class, 'confirmation'])->name('order.confirmation');

    // Order history (authenticated users only)
    Route::middleware('auth')->group(function () {
        Route::get('/orders', [OrderController::class, 'index'])->name('orders');
        Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    });
});

// Dashboard redirect (Breeze expects this route)
Route::middleware('auth')->get('/dashboard', function () {
    // Redirect admins to admin dashboard, customers to home
    /** @var User $user */
    $user = Auth::user();
    if ($user->isAdmin()) {
        return redirect('/admin');
    }
    return redirect('/');
})->name('dashboard');

// Profile routes (from Breeze)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin routes
require __DIR__.'/admin.php';

// Auth routes
require __DIR__.'/auth.php';
