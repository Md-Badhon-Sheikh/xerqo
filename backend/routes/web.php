<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// This app is an API backend for the React SPA; the root URL just reports status.
Route::get('/', fn () => response()->json([
    'name' => config('app.name').' API',
    'status' => 'ok',
    'api' => url('/api'),
]));

// Uploaded files normally come straight from the public/storage symlink. Some shared hosts
// don't allow symlinks — then Apache passes /storage/... here and Laravel serves the file.
Route::get('storage/{path}', function (string $path) {
    abort_if(str_contains($path, '..'), 404);
    abort_unless(Storage::disk('public')->exists($path), 404);

    return response()->file(Storage::disk('public')->path($path), ['Cache-Control' => 'public, max-age=2592000']);
})->where('path', '.*');
