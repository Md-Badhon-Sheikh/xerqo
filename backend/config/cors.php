<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The React SPA (FRONTEND_URL) calls the API from another origin during
    | development (Vite on :5173) and possibly in production. Several origins
    | may be given in FRONTEND_URL separated by commas.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        fn (string $origin) => rtrim(trim($origin), '/'),
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:5173'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Bearer tokens are sent in the Authorization header, so cookies are not required.
    'supports_credentials' => false,

];
