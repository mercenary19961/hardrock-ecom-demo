<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Services\CartService;
use Illuminate\Http\Request;
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
            'categories' => fn () => Category::query()
                ->whereNull('parent_id')
                ->active()
                ->ordered()
                ->get(),
        ];
    }
}
