<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\CheckoutController;
use App\Http\Controllers\Shop\CouponController;
use App\Http\Controllers\Shop\HomeController;
use App\Http\Controllers\Shop\LandingController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\PaymentController;
use App\Http\Controllers\Shop\ProductController;
use App\Http\Controllers\Webhooks\MoyasarWebhookController;
use App\Http\Controllers\Webhooks\TamaraWebhookController;
use App\Http\Controllers\Shop\ProfileController as ShopProfileController;
use App\Http\Controllers\Shop\ReviewController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Shop routes
Route::name('shop.')->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('home');
    Route::get('/category/{category:slug}', [LandingController::class, 'show'])->name('category');
    Route::get('/product/{product:slug}', [ProductController::class, 'show'])->name('product');
    Route::get('/search', [ProductController::class, 'search'])->name('search');

    // Cart routes
    Route::get('/cart', [CartController::class, 'index'])->name('cart');
    Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
    Route::patch('/cart/{item}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{item}', [CartController::class, 'remove'])->name('cart.remove');
    Route::get('/cart/data', [CartController::class, 'data'])->name('cart.data');

    // Checkout routes (require auth)
    Route::middleware('auth')->group(function () {
        Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
        Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
        Route::post('/checkout/whatsapp', [CheckoutController::class, 'whatsappOrder'])->name('checkout.whatsapp');

        // Start / retry hosted gateway payment for an order
        Route::get('/pay/{order}', [PaymentController::class, 'pay'])->name('payment.pay');
    });

    // Gateway returns the customer's browser here (success_url). Kept outside
    // the auth group so a returning shopper with an expired session is still
    // confirmed — fulfillment is verified against the gateway, not the session.
    Route::get('/payment/callback', [PaymentController::class, 'callback'])->name('payment.callback');
    Route::get('/payment/tamara/callback', [PaymentController::class, 'tamaraCallback'])->name('payment.tamara.callback');

    // Coupon routes
    Route::post('/coupon/apply', [CouponController::class, 'apply'])->name('coupon.apply');
    Route::post('/coupon/remove', [CouponController::class, 'remove'])->name('coupon.remove');
    Route::get('/coupon/current', [CouponController::class, 'current'])->name('coupon.current');
    Route::get('/coupon/available', [CouponController::class, 'available'])->name('coupon.available');

    // Order confirmation (accessible to anyone who just placed an order)
    Route::get('/order/{order}/confirmation', [OrderController::class, 'confirmation'])->name('order.confirmation');

    // Order history and reviews (require auth)
    Route::middleware('auth')->group(function () {
        Route::get('/orders', [OrderController::class, 'index'])->name('orders');
        Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');

        // Review routes
        Route::post('/product/{product:slug}/review', [ReviewController::class, 'store'])->name('review.store');
        Route::patch('/review/{review}', [ReviewController::class, 'update'])->name('review.update');
        Route::delete('/review/{review}', [ReviewController::class, 'destroy'])->name('review.destroy');
    });

    // Review helpful (can be anonymous)
    Route::post('/review/{review}/helpful', [ReviewController::class, 'helpful'])->name('review.helpful');
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

// Profile routes (Shop profile with tabs)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ShopProfileController::class, 'index'])->name('profile');
    Route::patch('/profile/update', [ShopProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password', [ShopProfileController::class, 'updatePassword'])->name('profile.password');
    Route::post('/profile/avatar', [ShopProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::delete('/profile/avatar', [ShopProfileController::class, 'removeAvatar'])->name('profile.avatar.remove');
    Route::delete('/profile', [ShopProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/profile/order/{order}', [ShopProfileController::class, 'orderDetails'])->name('profile.order');
});

// Payment gateway webhook (server-to-server, no auth, CSRF-exempt).
// Authenticated via shared secret + gateway re-fetch inside the controller.
Route::post('/webhooks/moyasar', [MoyasarWebhookController::class, 'handle'])->name('webhooks.moyasar');
Route::post('/webhooks/tamara', [TamaraWebhookController::class, 'handle'])->name('webhooks.tamara');

// Admin routes
require __DIR__.'/admin.php';

// Auth routes
require __DIR__.'/auth.php';
