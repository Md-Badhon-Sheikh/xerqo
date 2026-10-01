<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Hash Driver
    |--------------------------------------------------------------------------
    |
    | XERQO stores every password with bcrypt (Hash::make / the "hashed" cast).
    |
    */

    'driver' => 'bcrypt',

    /*
    |--------------------------------------------------------------------------
    | Bcrypt Options
    |--------------------------------------------------------------------------
    */

    'bcrypt' => [
        'rounds' => (int) env('BCRYPT_ROUNDS', 12),
        'verify' => env('HASH_VERIFY', true),
        'limit' => env('BCRYPT_LIMIT', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Argon Options (unused, kept for completeness)
    |--------------------------------------------------------------------------
    */

    'argon' => [
        'memory' => 65536,
        'threads' => 1,
        'time' => 4,
        'verify' => env('HASH_VERIFY', true),
    ],

    'rehash_on_login' => true,

];
