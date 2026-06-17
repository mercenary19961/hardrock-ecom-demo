<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', '/auth/google/callback'),
    ],

    // Moyasar payment gateway (mada, Visa/Mastercard, Apple Pay, STC Pay).
    // Use sk_test_* / pk_test_* keys in development. The webhook_secret is a
    // value YOU choose; it is sent on the callback URL and compared on inbound
    // notifications to prove they came from Moyasar.
    'moyasar' => [
        'secret_key' => env('MOYASAR_SECRET_KEY'),
        'publishable_key' => env('MOYASAR_PUBLISHABLE_KEY'),
        'webhook_secret' => env('MOYASAR_WEBHOOK_SECRET'),
        'base_url' => env('MOYASAR_BASE_URL', 'https://api.moyasar.com/v1'),
        'currency' => env('MOYASAR_CURRENCY', 'SAR'),
    ],

    // Tamara BNPL ("split in 4" / "pay later"). Two separate secrets:
    //   api_token        -> Bearer auth for the REST API
    //   notification_token -> HS256 key that signs the webhook `tamara-token` JWT
    // Use the sandbox base_url + sandbox tokens in development.
    'tamara' => [
        'api_token' => env('TAMARA_API_TOKEN'),
        'notification_token' => env('TAMARA_NOTIFICATION_TOKEN'),
        'public_key' => env('TAMARA_PUBLIC_KEY'),
        'base_url' => env('TAMARA_BASE_URL', 'https://api-sandbox.tamara.co'),
        'currency' => env('TAMARA_CURRENCY', 'SAR'),
        'country' => env('TAMARA_COUNTRY', 'SA'),
        // Number of instalments to offer for the default PAY_BY_INSTALMENTS flow.
        'instalments' => (int) env('TAMARA_INSTALMENTS', 3),
    ],

    // OTO (Tryoto) shipping aggregator — one integration, many KSA carriers
    // (Aramex, SMSA, iMile, Barq, Naqel, ...). The refresh_token comes from the
    // OTO dashboard (Sales Channel > OTO API) and is exchanged for short-lived
    // access tokens. webhook_secret authenticates inbound status callbacks.
    'oto' => [
        'refresh_token' => env('OTO_REFRESH_TOKEN'),
        'base_url' => env('OTO_BASE_URL', 'https://api.tryoto.com/rest/v2'),
        'webhook_secret' => env('OTO_WEBHOOK_SECRET'),
        // Warehouse/origin city shipments are dispatched from.
        'origin_city' => env('OTO_ORIGIN_CITY', 'Riyadh'),
    ],

];
