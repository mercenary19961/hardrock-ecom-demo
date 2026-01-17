<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);

        // Trust all proxies (Cloudflare, Railway)
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle CSRF token mismatch for Inertia requests - redirect back to refresh the token
        $exceptions->respond(function (Response $response, Throwable $e, $request) {
            if ($e instanceof TokenMismatchException) {
                // For Inertia requests, redirect back to refresh the page and get a new token
                if ($request->header('X-Inertia')) {
                    return back()->with('error', 'Your session has expired. Please try again.');
                }
            }
            return $response;
        });
    })->create();
