<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            abort(403, 'Unauthorized. Admin access required.');
        }

        // Extend session lifetime for admin users
        $adminLifetime = config('session.admin_lifetime', 480);
        config(['session.lifetime' => $adminLifetime]);

        return $next($request);
    }
}
