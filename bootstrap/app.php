<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Session\TokenMismatchException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

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
            'admin'      => \App\Http\Middleware\AdminMiddleware::class,
            'permission' => \App\Http\Middleware\RequirePermission::class,
        ]);

        // Payment gateway webhooks are server-to-server and cannot carry a CSRF
        // token. They are authenticated by a shared secret + gateway re-fetch.
        $middleware->validateCsrfTokens(except: [
            'webhooks/*',
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

            // Render Inertia error pages for HTTP exceptions (404, 500, etc.)
            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();

                // Only render custom error pages for specific status codes
                if (in_array($status, [403, 404, 500, 503])) {
                    return Inertia::render('Error', [
                        'status' => $status,
                        'message' => $e->getMessage(),
                    ])
                        ->toResponse($request)
                        ->setStatusCode($status);
                }
            }

            return $response;
        });
    })->create();
