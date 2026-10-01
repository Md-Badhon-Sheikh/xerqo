<?php

use Illuminate\Support\Facades\Route;

// This app is an API backend for the React SPA; the root URL just reports status.
Route::get('/', fn () => response()->json([
    'name' => config('app.name').' API',
    'status' => 'ok',
    'api' => url('/api'),
]));
