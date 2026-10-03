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

Route::get('orders/track', [OrderController::class, 'track'])->middleware('throttle:30,1');
Route::post('coupons/validate', [CouponController::class, 'check'])->middleware('throttle:30,1');

// ---------------------------------------------------------------- Auth
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('otp/send', [AuthController::class, 'sendOtp'])->middleware('throttle:6,1');
    Route::post('otp/login', [AuthController::class, 'otpLogin'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

// ---------------------------------------------------------------- Customer account
Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [Customer\ProfileController::class, 'show']);
    Route::put('me', [Customer\ProfileController::class, 'update']);
    Route::put('me/password', [Customer\ProfileController::class, 'password']);
    Route::post('me/phone/otp', [Customer\ProfileController::class, 'phoneOtp'])->middleware('throttle:6,1');
    Route::delete('me', [Customer\ProfileController::class, 'destroy'])->middleware('throttle:5,1');

    Route::get('me/orders', [Customer\OrderController::class, 'index']);
    Route::get('me/orders/{orderNumber}', [Customer\OrderController::class, 'show']);
    Route::post('me/orders/{orderNumber}/payment', [Customer\OrderController::class, 'submitPayment'])->middleware('throttle:10,1');

    // checkout needs a signed-in customer (no guest orders)
    Route::post('orders', [OrderController::class, 'store'])->middleware('throttle:20,1');

    Route::apiResource('me/addresses', Customer\AddressController::class);

    Route::get('me/wishlist', [Customer\WishlistController::class, 'index']);
    Route::post('me/wishlist', [Customer\WishlistController::class, 'store']);
    Route::delete('me/wishlist/{product}', [Customer\WishlistController::class, 'destroy']);

    Route::get('me/reviews', [Customer\ReviewController::class, 'index']);
    Route::post('reviews', [Customer\ReviewController::class, 'store'])->middleware('throttle:20,1');
    Route::put('reviews/{review}', [Customer\ReviewController::class, 'update'])->middleware('throttle:20,1');
    Route::delete('reviews/{review}', [Customer\ReviewController::class, 'destroy']);
    Route::get('me/orders/{orderNumber}/review', [Customer\ReviewController::class, 'order']);
    Route::post('me/orders/{orderNumber}/feedback', [Customer\ReviewController::class, 'feedback'])->middleware('throttle:20,1');

    Route::get('me/returns', [Customer\ReturnController::class, 'index']);
    Route::post('returns', [Customer\ReturnController::class, 'store'])->middleware('throttle:10,1');
});

// ---------------------------------------------------------------- Admin panel
// "admin" = active staff user; "admin:{module}" also checks the role's permission matrix
// (GET => view, POST => create, PUT/PATCH => edit, DELETE => delete).
Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin', 'admin.activity'])->group(function () {
    Route::get('dashboard', Admin\DashboardController::class)->middleware('admin:dashboard');
    Route::get('badges', [Admin\DashboardController::class, 'badges']); // filtered by the user's permissions

    // every staff member: their own alerts and account
    Route::get('notifications', [Admin\NotificationController::class, 'index']);
    Route::post('notifications/read', [Admin\NotificationController::class, 'read']);
    Route::get('notifications/preferences', [Admin\NotificationController::class, 'preferences']);
    Route::put('notifications/preferences', [Admin\NotificationController::class, 'updatePreferences']);
    Route::delete('notifications/{id}', [Admin\NotificationController::class, 'destroy']);
    Route::get('profile', [Admin\ProfileController::class, 'show']);
    Route::put('profile', [Admin\ProfileController::class, 'update']);
    Route::put('profile/password', [Admin\ProfileController::class, 'password'])->middleware('throttle:6,1');
    Route::match(['post', 'delete'], 'profile/avatar', [Admin\ProfileController::class, 'avatar']);
    Route::get('profile/sessions', [Admin\ProfileController::class, 'sessions']);
    Route::delete('profile/sessions/{id?}', [Admin\ProfileController::class, 'revoke'])->whereNumber('id');

    // Settings → Security
    Route::middleware('admin:staff')->group(function () {
        Route::get('security/activity', [Admin\SecurityController::class, 'activity']);
        Route::get('security/sessions', [Admin\SecurityController::class, 'sessions']);
    });
    Route::delete('security/sessions/{id?}', [Admin\SecurityController::class, 'revoke'])->whereNumber('id')->middleware('super-admin');

    // Orders (bound by order number, e.g. /api/admin/orders/XQ-24817)
    Route::middleware('admin:orders')->group(function () {
        Route::get('orders', [Admin\OrderController::class, 'index']);
        Route::get('orders/{order:order_number}', [Admin\OrderController::class, 'show']);
        Route::match(['put', 'patch'], 'orders/{order:order_number}', [Admin\OrderController::class, 'update']);
        Route::patch('orders/{order:order_number}/status', [Admin\OrderController::class, 'updateStatus']);
    });

    // Manual payment verification (Payments & COD)
    Route::get('payments', [Admin\PaymentController::class, 'index'])->middleware('admin:payments');
    Route::middleware('admin:payments,edit')->group(function () {
        Route::patch('payments/{payment}/verify', [Admin\PaymentController::class, 'verify']);
        Route::patch('payments/{payment}/reject', [Admin\PaymentController::class, 'reject']);
    });

    // Products + images (image management counts as editing the product)
    Route::apiResource('products', Admin\ProductController::class)->middleware('admin:products');
    Route::middleware('admin:products,edit')->group(function () {
        Route::post('products/{product}/images', [Admin\ProductController::class, 'uploadImages']);
        Route::patch('products/{product}/images/reorder', [Admin\ProductController::class, 'reorderImages']);
        Route::delete('products/{product}/images/{image}', [Admin\ProductController::class, 'destroyImage']);
        Route::post('products/{product}/variants/{variant}/image', [Admin\ProductController::class, 'uploadVariantImage']);
        Route::delete('products/{product}/variants/{variant}/image', [Admin\ProductController::class, 'destroyVariantImage']);
    });

    Route::apiResource('categories', Admin\CategoryController::class)->middleware('admin:categories');
    // brands are part of the catalogue structure, so they share the categories permission
    Route::apiResource('brands', Admin\BrandController::class)->middleware('admin:categories');

    Route::get('inventory', [Admin\InventoryController::class, 'index'])->middleware('admin:inventory');
    Route::get('inventory/movements', [Admin\InventoryController::class, 'movements'])->middleware('admin:inventory');
    Route::post('inventory/adjust', [Admin\InventoryController::class, 'adjust'])->middleware('admin:inventory,edit');

    Route::middleware('admin:customers')->group(function () {
        Route::get('customers', [Admin\CustomerController::class, 'index']);
        Route::get('customers/{customer}', [Admin\CustomerController::class, 'show']);
    });
    Route::middleware('admin:customers,edit')->group(function () {
        Route::patch('customers/{customer}', [Admin\CustomerController::class, 'update']);
        Route::post('customers/{customer}/sms', [Admin\CustomerController::class, 'sms'])->middleware('throttle:20,1');
    });

    Route::middleware('admin:reviews')->group(function () {
        Route::get('reviews', [Admin\ReviewController::class, 'index']);
        Route::get('reviews/feedback', [Admin\ReviewController::class, 'feedback']);
        Route::patch('reviews/{review}/approve', [Admin\ReviewController::class, 'approve']);
        Route::patch('reviews/{review}/reject', [Admin\ReviewController::class, 'reject']);
        Route::patch('reviews/{review}/reply', [Admin\ReviewController::class, 'reply']);
        Route::patch('reviews/{review}/feature', [Admin\ReviewController::class, 'feature']);
        Route::delete('reviews/{review}', [Admin\ReviewController::class, 'destroy']);
    });

    Route::apiResource('coupons', Admin\CouponController::class)->middleware('admin:coupons');
    // flash sales are a promotion, so they share the coupons (marketing) permission
    Route::apiResource('flash-sales', Admin\FlashSaleController::class)
        ->parameters(['flash-sales' => 'flashSale'])
        ->middleware('admin:coupons');

    Route::apiResource('returns', Admin\ReturnController::class)
        ->only(['index', 'show', 'update'])
        ->middleware('admin:returns');

    Route::middleware('admin:staff')->group(function () {
        Route::apiResource('staff', Admin\StaffController::class)->parameters(['staff' => 'user']);
        Route::post('staff/{user}/invite', [Admin\StaffController::class, 'invite'])->middleware(['admin:staff,create', 'throttle:10,1']);
        Route::apiResource('roles', Admin\RoleController::class);
    });

    Route::middleware('admin:settings')->group(function () {
        Route::get('settings', [Admin\SettingController::class, 'index']);
        Route::put('settings', [Admin\SettingController::class, 'update']);

        Route::get('sms', [Admin\SmsController::class, 'index']);
        Route::get('sms/logs', [Admin\SmsController::class, 'logs']);
    });

    Route::middleware('admin:settings,edit')->group(function () {
        Route::put('sms/templates/{key}', [Admin\SmsController::class, 'updateTemplate']);
        Route::post('sms/test', [Admin\SmsController::class, 'test'])->middleware('throttle:10,1');
        Route::put('sms/email', [Admin\SmsController::class, 'updateEmail']);
        Route::post('sms/email/test', [Admin\SmsController::class, 'testEmail'])->middleware('throttle:5,1');
    });

    // the SMS account and wallet: no role can be granted these, only the Super Admin has them
    Route::middleware('super-admin')->group(function () {
        Route::get('sms/gateway', [Admin\SmsGatewayController::class, 'show']);
        Route::put('sms/gateway', [Admin\SmsGatewayController::class, 'update']);
        Route::get('sms/gateway/remote-balance', [Admin\SmsGatewayController::class, 'remoteBalance']);
        Route::get('sms/recharges', [Admin\SmsGatewayController::class, 'recharges']);
        Route::post('sms/recharges', [Admin\SmsGatewayController::class, 'recharge']);
    });

    Route::apiResource('banners', Admin\BannerController::class)->middleware('admin:content');
    Route::put('content/announcement', [Admin\SettingController::class, 'announcement'])->middleware('admin:content,edit');
});
