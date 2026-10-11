<?php

use App\Support\SiteShell;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// On the live site Apache sends every page address here, so the React app's index.html goes out with the
// favicon, title and share image from Settings (see SiteShell). Locally there is no index.html next to
// Laravel, and the root URL just reports the API status. No session or cookies for these pages.
Route::get('/', fn () => SiteShell::exists() ? SiteShell::response() : response()->json([
    'name' => config('app.name').' API',
    'status' => 'ok',
    'api' => url('/api'),
]))->withoutMiddleware('web');

// Uploaded files normally come straight from the public/storage symlink. Some shared hosts
// don't allow symlinks — then Apache passes /storage/... here and Laravel serves the file.
Route::get('storage/{path}', function (string $path) {
    abort_if(str_contains($path, '..'), 404);
    abort_unless(Storage::disk('public')->exists($path), 404);

    return response()->file(Storage::disk('public')->path($path), ['Cache-Control' => 'public, max-age=2592000']);
})->where('path', '.*');

// every other page of the React app (it shows its own "not found" page)
Route::get('{page}', fn () => SiteShell::exists() ? SiteShell::response() : abort(404))
    ->where('page', '(?!(?:api|storage|sanctum|up)(?:/|$)).*')
    ->withoutMiddleware('web');
