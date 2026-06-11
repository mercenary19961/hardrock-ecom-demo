<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Reconcile missed webhooks and release stock from abandoned/failed payments.
Schedule::command('payments:expire-pending')
    ->everyFiveMinutes()
    ->withoutOverlapping();
