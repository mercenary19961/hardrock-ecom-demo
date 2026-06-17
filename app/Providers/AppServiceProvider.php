<?php

namespace App\Providers;

use App\Services\Payments\MoyasarGateway;
use App\Services\Payments\PaymentGateway;
use App\Services\Payments\Tamara\TamaraClient;
use App\Services\Shipping\Oto\OtoClient;
use App\Services\Shipping\Oto\OtoGateway;
use App\Services\Shipping\ShippingGateway;
use Illuminate\Auth\SessionGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind the active payment gateway behind the contract. Swap this single
        // line to switch providers (e.g. a future TapGateway) app-wide.
        $this->app->singleton(PaymentGateway::class, function () {
            return new MoyasarGateway(
                secretKey: (string) config('services.moyasar.secret_key'),
                baseUrl: rtrim((string) config('services.moyasar.base_url'), '/'),
                currency: (string) config('services.moyasar.currency', 'SAR'),
                webhookToken: (string) config('services.moyasar.webhook_secret'),
                successUrl: URL::route('shop.payment.callback'),
                callbackUrl: URL::route('webhooks.moyasar'),
            );
        });

        // Tamara BNPL client (TamaraService autoresolves with this + CheckoutService).
        $this->app->singleton(TamaraClient::class, function () {
            return new TamaraClient(
                apiToken: (string) config('services.tamara.api_token'),
                notificationToken: (string) config('services.tamara.notification_token'),
                baseUrl: rtrim((string) config('services.tamara.base_url'), '/'),
            );
        });

        // OTO (Tryoto) shipping. Swap this binding for a future TorodGateway to
        // change shipping aggregators app-wide.
        $this->app->singleton(OtoClient::class, function () {
            return new OtoClient(
                refreshToken: (string) config('services.oto.refresh_token'),
                baseUrl: rtrim((string) config('services.oto.base_url'), '/'),
            );
        });

        $this->app->singleton(ShippingGateway::class, function ($app) {
            return new OtoGateway(
                client: $app->make(OtoClient::class),
                originCity: (string) config('services.oto.origin_city', 'Riyadh'),
                webhookSecret: (string) config('services.oto.webhook_secret'),
            );
        });
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
