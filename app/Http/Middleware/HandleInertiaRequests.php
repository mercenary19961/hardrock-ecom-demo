<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Models\Setting;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(
        protected CartService $cartService
    ) {}

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'url' => $request->path() === '/' ? '/' : '/' . $request->path(),
            'cart' => fn () => $this->cartService->getCartData(
                $this->cartService->getCart($request->user())
            ),
            'categories' => fn () => Cache::remember('nav_categories', 3600, fn () =>
                Category::query()
                    ->whereNull('parent_id')
                    ->active()
                    ->ordered()
                    ->get()
            ),
            'siteSettings' => fn () => Cache::remember('site_settings', 3600, fn () => [
                'store_name' => Setting::get('store_name', 'HardRock Store'),
                'store_name_ar' => Setting::get('store_name_ar', 'متجر هارد روك'),
                'store_email' => Setting::get('store_email', 'support@hardrock-demo.com'),
                'store_phone' => Setting::get('store_phone', '+962 79 170 0034'),
                'store_address' => Setting::get('store_address', 'Amman, Jordan'),
                'store_address_ar' => Setting::get('store_address_ar', 'عمّان، الأردن'),
                'currency_code' => Setting::get('currency_code', 'JOD'),
                'currency_symbol' => Setting::get('currency_symbol', 'JOD'),
                'currency_symbol_ar' => Setting::get('currency_symbol_ar', 'دينار'),
                'low_stock_threshold' => (int) Setting::get('low_stock_threshold', 10),
            ]),
        ];
    }
}
