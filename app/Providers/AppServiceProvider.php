<?php

namespace App\Providers;

use Illuminate\Auth\SessionGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Set the remember me cookie duration to 30 days (43200 minutes)
        $this->setRememberMeDuration();
    }

    /**
     * Set the remember me cookie duration from config.
     */
    protected function setRememberMeDuration(): void
    {
        $duration = config('auth.remember_me_duration', 43200);

        Auth::extend('session', function ($app, $name, array $config) use ($duration) {
            $provider = Auth::createUserProvider($config['provider']);

            $guard = new SessionGuard(
                $name,
                $provider,
                $app['session.store'],
                $app['request']
            );

            // Set remember me duration (in minutes)
            $guard->setRememberDuration($duration);

            if (method_exists($guard, 'setCookieJar')) {
                $guard->setCookieJar($app['cookie']);
            }

            if (method_exists($guard, 'setDispatcher')) {
                $guard->setDispatcher($app['events']);
            }

            if (method_exists($guard, 'setRequest')) {
                $guard->setRequest($app->refresh('request', $guard, 'setRequest'));
            }

            return $guard;
        });
    }
}
