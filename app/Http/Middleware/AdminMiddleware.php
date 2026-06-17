<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Allow admins and editors into the admin panel.
     * Pass $guard = 'admin' on specific routes that only admins may access.
     */
    public function handle(Request $request, Closure $next, string $guard = 'staff'): Response
    {
        $user = $request->user();

        $allowed = match ($guard) {
            'admin' => $user?->isAdmin(),
            default => $user?->isStaff(),
        };

        if (! $allowed) {
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            abort(403, 'Unauthorized.');
        }

        // Extend session lifetime for staff users
        config(['session.lifetime' => config('session.admin_lifetime', 480)]);

        return $next($request);
    }
}
