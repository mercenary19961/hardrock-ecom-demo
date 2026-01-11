<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile page with tabs.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tab = $request->query('tab', 'overview');

        // Get orders with items
        $orders = $user->orders()
            ->with(['items.product'])
            ->recent()
            ->limit(10)
            ->get();

        // Get available coupons
        $coupons = Coupon::valid()
            ->select(['id', 'code', 'name', 'name_ar', 'description', 'description_ar', 'type', 'value', 'min_order_amount', 'max_discount', 'ends_at'])
            ->orderBy('ends_at', 'asc')
            ->get();

        // Get stats for overview
        $stats = [
            'total_orders' => $user->orders()->count(),
            'total_spent' => $user->orders()->where('status', '!=', 'cancelled')->sum('total'),
            'pending_orders' => $user->orders()->where('status', 'pending')->count(),
            'wishlist_count' => 0, // We'll add this later if needed
        ];

        return Inertia::render('Shop/Profile', [
            'user' => $user,
            'orders' => $orders,
            'coupons' => $coupons,
            'stats' => $stats,
            'activeTab' => $tab,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $request->user()->update($validated);

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Get order details via AJAX.
     */
    public function orderDetails(Request $request, Order $order): JsonResponse
    {
        // Ensure user owns this order
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $order->load(['items.product', 'coupon']);

        return response()->json([
            'success' => true,
            'order' => $order,
        ]);
    }

    /**
     * Update the user's avatar.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update(['avatar' => $path]);

        return back()->with('success', 'Avatar updated successfully.');
    }

    /**
     * Remove the user's avatar.
     */
    public function removeAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return back()->with('success', 'Avatar removed successfully.');
    }
}
