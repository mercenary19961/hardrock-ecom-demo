<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\CheckoutController;
use App\Http\Controllers\Shop\CouponController;
use App\Http\Controllers\Shop\HomeController;
use App\Http\Controllers\Shop\LandingController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\ProductController;
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

    // Checkout routes
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::post('/checkout/whatsapp', [CheckoutController::class, 'whatsappOrder'])->name('checkout.whatsapp');

    // Coupon routes
    Route::post('/coupon/apply', [CouponController::class, 'apply'])->name('coupon.apply');
    Route::post('/coupon/remove', [CouponController::class, 'remove'])->name('coupon.remove');
    Route::get('/coupon/current', [CouponController::class, 'current'])->name('coupon.current');
    Route::get('/coupon/available', [CouponController::class, 'available'])->name('coupon.available');

    // Order confirmation (accessible to anyone who just placed an order)
    Route::get('/order/{order}/confirmation', [OrderController::class, 'confirmation'])->name('order.confirmation');

    // Order history (authenticated users only)
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

// Performance diagnostic (temporary - remove after debugging)
Route::get('/perf-check', function () {
    $timings = [];
    $start = microtime(true);

    // 1. Test basic PHP response
    $timings['php_boot'] = round((microtime(true) - $start) * 1000, 2);

    // 2. Test Redis connection
    $redisStart = microtime(true);
    try {
        Cache::put('perf_test', 'ok', 10);
        Cache::get('perf_test');
        $timings['redis'] = round((microtime(true) - $redisStart) * 1000, 2);
    } catch (\Exception $e) {
        $timings['redis'] = 'error: ' . $e->getMessage();
    }

    // 3. Test MySQL connection
    $dbStart = microtime(true);
    try {
        DB::select('SELECT 1');
        $timings['mysql_connect'] = round((microtime(true) - $dbStart) * 1000, 2);
    } catch (\Exception $e) {
        $timings['mysql_connect'] = 'error: ' . $e->getMessage();
    }

    // 4. Test simple query
    $queryStart = microtime(true);
    try {
        DB::table('categories')->count();
        $timings['mysql_query'] = round((microtime(true) - $queryStart) * 1000, 2);
    } catch (\Exception $e) {
        $timings['mysql_query'] = 'error: ' . $e->getMessage();
    }

    // 5. Test Eloquent with eager loading (like homepage)
    $eloquentStart = microtime(true);
    try {
        \App\Models\Product::with('images')->take(8)->get();
        $timings['eloquent_eager'] = round((microtime(true) - $eloquentStart) * 1000, 2);
    } catch (\Exception $e) {
        $timings['eloquent_eager'] = 'error: ' . $e->getMessage();
    }

    $timings['total'] = round((microtime(true) - $start) * 1000, 2);

    return response()->json([
        'timings_ms' => $timings,
        'cache_driver' => config('cache.default'),
        'session_driver' => config('session.driver'),
        'db_host' => config('database.connections.mysql.host'),
    ]);
});

// Admin routes
require __DIR__.'/admin.php';

// Auth routes
require __DIR__.'/auth.php';
