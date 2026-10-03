<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\Customer;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| XERQO REST API  (prefix: /api, JSON only, Bearer token auth via Sanctum)
|--------------------------------------------------------------------------
*/

// ---------------------------------------------------------------- Public storefront
Route::get('home', HomeController::class);
Route::get('categories', [CategoryController::class, 'index']);
Route::get('brands', [BrandController::class, 'index']);
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{slug}', [ProductController::class, 'show']);
Route::get('products/{slug}/reviews', [ProductController::class, 'reviews']);
Route::get('banners', [BannerController::class, 'index']);
Route::get('settings', [SettingController::class, 'index']);

Route::post('orders', [OrderController::class, 'store'])->middleware('throttle:20,1');
Route::get('orders/track', [OrderController::class, 'track'])->middleware('throttle:30,1');
Route::post('coupons/validate', [CouponController::class, 'check'])->middleware('throttle:30,1');

// ---------------------------------------------------------------- Auth
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

// ---------------------------------------------------------------- Customer account
Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [Customer\ProfileController::class, 'show']);
    Route::put('me', [Customer\ProfileController::class, 'update']);
    Route::put('me/password', [Customer\ProfileController::class, 'password']);

    Route::get('me/orders', [Customer\OrderController::class, 'index']);
    Route::get('me/orders/{orderNumber}', [Customer\OrderController::class, 'show']);

    Route::apiResource('me/addresses', Customer\AddressController::class);

    Route::get('me/wishlist', [Customer\WishlistController::class, 'index']);
    Route::post('me/wishlist', [Customer\WishlistController::class, 'store']);
    Route::delete('me/wishlist/{product}', [Customer\WishlistController::class, 'destroy']);

    Route::get('me/reviews', [Customer\ReviewController::class, 'index']);
    Route::post('reviews', [Customer\ReviewController::class, 'store'])->middleware('throttle:20,1');

    Route::get('me/returns', [Customer\ReturnController::class, 'index']);
    Route::post('returns', [Customer\ReturnController::class, 'store'])->middleware('throttle:10,1');
});

// ---------------------------------------------------------------- Admin panel
// "admin" = active staff user; "admin:{module}" also checks the role's permission matrix
// (GET => view, POST => create, PUT/PATCH => edit, DELETE => delete).
Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('dashboard', Admin\DashboardController::class)->middleware('admin:dashboard');

    // Orders (bound by order number, e.g. /api/admin/orders/XQ-24817)
    Route::middleware('admin:orders')->group(function () {
        Route::get('orders', [Admin\OrderController::class, 'index']);
        Route::get('orders/{order:order_number}', [Admin\OrderController::class, 'show']);
        Route::match(['put', 'patch'], 'orders/{order:order_number}', [Admin\OrderController::class, 'update']);
        Route::patch('orders/{order:order_number}/status', [Admin\OrderController::class, 'updateStatus']);
    });

    // Products + images (image management counts as editing the product)
    Route::apiResource('products', Admin\ProductController::class)->middleware('admin:products');
    Route::middleware('admin:products,edit')->group(function () {
        Route::post('products/{product}/images', [Admin\ProductController::class, 'uploadImages']);
        Route::patch('products/{product}/images/reorder', [Admin\ProductController::class, 'reorderImages']);
        Route::delete('products/{product}/images/{image}', [Admin\ProductController::class, 'destroyImage']);
    });

    Route::apiResource('categories', Admin\CategoryController::class)->middleware('admin:categories');

    Route::get('inventory', [Admin\InventoryController::class, 'index'])->middleware('admin:inventory');
    Route::post('inventory/adjust', [Admin\InventoryController::class, 'adjust'])->middleware('admin:inventory,edit');

    Route::middleware('admin:customers')->group(function () {
        Route::get('customers', [Admin\CustomerController::class, 'index']);
        Route::get('customers/{customer}', [Admin\CustomerController::class, 'show']);
    });

    Route::middleware('admin:reviews')->group(function () {
        Route::get('reviews', [Admin\ReviewController::class, 'index']);
        Route::patch('reviews/{review}/approve', [Admin\ReviewController::class, 'approve']);
        Route::patch('reviews/{review}/reject', [Admin\ReviewController::class, 'reject']);
        Route::delete('reviews/{review}', [Admin\ReviewController::class, 'destroy']);
    });

    Route::apiResource('coupons', Admin\CouponController::class)->middleware('admin:coupons');

    Route::apiResource('returns', Admin\ReturnController::class)
        ->only(['index', 'show', 'update'])
        ->middleware('admin:returns');

    Route::middleware('admin:staff')->group(function () {
        Route::apiResource('staff', Admin\StaffController::class)->parameters(['staff' => 'user']);
        Route::apiResource('roles', Admin\RoleController::class);
    });

    Route::middleware('admin:settings')->group(function () {
        Route::get('settings', [Admin\SettingController::class, 'index']);
        Route::put('settings', [Admin\SettingController::class, 'update']);
    });

    Route::apiResource('banners', Admin\BannerController::class)->middleware('admin:content');
});
