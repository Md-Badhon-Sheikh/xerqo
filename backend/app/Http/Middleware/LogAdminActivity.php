<?php

namespace App\Http\Middleware;

use App\Models\Product;
use App\Support\Activity;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Records every successful change made through the admin API in the activity log,
 * with a readable description ("Order #XQ-24817 → shipped"). Reads are not logged,
 * and secrets (passwords, API keys) never are.
 */
class LogAdminActivity
{
    // resource => [category, singular, attribute used as its name]
    private const RESOURCES = [
        'banners' => ['content', 'banner', 'title'],
        'brands' => ['catalog', 'brand', 'name'],
        'categories' => ['catalog', 'category', 'name'],
        'coupons' => ['marketing', 'coupon', 'code'],
        'flash-sales' => ['marketing', 'flash sale', 'title'],
        'products' => ['catalog', 'product', 'name'],
        'roles' => ['staff', 'role', 'name'],
        'staff' => ['staff', 'staff member', 'name'],
    ];

    private const SECRETS = ['password', 'password_confirmation', 'current_password', 'api_key', 'secret_key'];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->isMethod('GET') || $response->getStatusCode() >= 400 || ! $request->route()) {
            return $response;
        }

        [$category, $description, $subject] = $this->describe($request, $response) ?? [null, null, null];

        if ($description) {
            $fields = array_values(array_diff(array_keys($request->except(self::SECRETS)), ['_method']));
            Activity::log(
                $this->action($request),
                $category,
                $description,
                $subject instanceof Model ? $subject : null,
                $fields ? ['fields' => array_slice($fields, 0, 20)] : [],
            );
        }

        return $response;
    }

    private function action(Request $request): string
    {
        $uri = preg_replace(['#^api/admin/#', '#:\w+}#'], ['', '}'], $request->route()->uri());

        return mb_substr(strtolower($request->method()).':'.$uri, 0, 60);
    }

    /**
     * @return array{0: string, 1: string, 2: mixed}|null
     */
    private function describe(Request $request, Response $response): ?array
    {
        $uri = preg_replace(['#^api/admin/#', '#:\w+}#'], ['', '}'], $request->route()->uri());
        $p = fn (string $key) => $request->route($key);
        $verb = $request->method();
        $in = fn (string $key, $default = null) => $request->input($key, $default);
        $created = fn () => json_decode((string) $response->getContent(), true)['data'] ?? [];
        $order = fn ($o) => '#'.($o?->order_number ?? '?');

        switch ($verb.' '.$uri) {
            case 'PATCH orders/{order}/status':
                return ['orders', "Order {$order($p('order'))} → {$in('status')}", $p('order')];
            case 'PUT orders/{order}':
            case 'PATCH orders/{order}':
                $what = $request->has('tracking_code') || $request->has('courier') ? 'courier details' : ($request->has('admin_note') ? 'internal note' : 'details');

                return ['orders', "Edited {$what} of order {$order($p('order'))}", $p('order')];
            case 'PATCH payments/{payment}/verify':
                return ['payments', 'Verified payment of ৳'.number_format((float) $p('payment')?->amount)." for order {$order($p('payment')?->order)}", $p('payment')];
            case 'PATCH payments/{payment}/reject':
                return ['payments', "Rejected payment for order {$order($p('payment')?->order)}: ".mb_substr((string) $in('note'), 0, 120), $p('payment')];
            case 'PUT returns/{return}':
            case 'PATCH returns/{return}':
                return ['returns', 'Return R-'.$p('return')?->id." → {$in('status')}", $p('return')];
            case 'POST inventory/adjust':
                $product = Product::find($in('product_id'));
                $qty = (int) $in('quantity');
                $sign = $in('type') === 'subtract' ? '−' : ($in('type') === 'set' ? '=' : '+');

                return ['catalog', "Stock {$sign}{$qty} · ".($product?->name ?? 'product').($in('reason') ? " ({$in('reason')})" : ''), $product];
            case 'PATCH customers/{customer}':
                $c = $p('customer');
                $text = match (true) {
                    $request->has('cod_blocked') => ($in('cod_blocked') ? 'Blocked COD for ' : 'Allowed COD again for ').$c?->name,
                    $request->has('is_active') => ($in('is_active') ? 'Enabled ' : 'Disabled ').$c?->name.'’s account',
                    default => 'Updated the note on '.$c?->name,
                };

                return ['customers', $text, $c];
            case 'POST customers/{customer}/sms':
                return ['customers', 'Sent an SMS to '.$p('customer')?->name, $p('customer')];
            case 'PATCH reviews/{review}/approve':
            case 'PATCH reviews/{review}/reject':
            case 'PATCH reviews/{review}/feature':
            case 'PATCH reviews/{review}/reply':
            case 'DELETE reviews/{review}':
                $r = $p('review');
                $label = match (true) {
                    str_ends_with($uri, 'approve') => 'Published',
                    str_ends_with($uri, 'reject') => 'Hid',
                    str_ends_with($uri, 'feature') => $in('is_featured') ? 'Featured' : 'Unfeatured',
                    str_ends_with($uri, 'reply') => $in('reply') ? 'Replied to' : 'Removed the reply on',
                    default => 'Deleted',
                };

                return ['reviews', "{$label} a {$r?->rating}★ review on ".($r?->product?->name ?? 'a product'), $verb === 'DELETE' ? null : $r];
            case 'PUT settings':
                return ['settings', 'Changed settings: '.implode(', ', array_keys((array) $in('settings', []))), null];
            case 'PUT content/announcement':
                return ['content', 'Updated the announcement bar', null];
            case 'PUT sms/gateway':
                $changes = array_filter([
                    $request->has('is_enabled') ? ($in('is_enabled') ? 'switched SMS on' : 'switched SMS off') : null,
                    $request->filled('api_key') || $request->filled('secret_key') ? 'changed the Reve keys' : null,
                    $request->has('rate_paisa') ? "rate {$in('rate_paisa')} paisa" : null,
                ]);

                return ['sms', 'SMS gateway: '.($changes ? implode(', ', $changes) : 'updated'), null];
            case 'POST sms/recharges':
                $amount = (float) $in('amount');

                return ['sms', ($amount >= 0 ? 'Added ' : 'Removed ').'৳'.number_format(abs($amount), 2).' SMS balance', null];
            case 'PUT sms/templates/{key}':
                return ['sms', "Edited the SMS template “{$p('key')}”".($in('enabled') ? '' : ' (off)'), null];
            case 'POST sms/test':
                return ['sms', "Sent a test SMS to {$in('phone')}", null];
            case 'PUT sms/email':
                return ['settings', 'Changed email notification settings', null];
            case 'POST sms/email/test':
                return ['settings', "Sent a test email to {$in('email')}", null];
            case 'POST staff/{user}/invite':
                return ['staff', 'Sent an invite to '.$p('user')?->email, $p('user')];
            case 'POST products/{product}/images':
            case 'PATCH products/{product}/images/reorder':
            case 'DELETE products/{product}/images/{image}':
            case 'POST products/{product}/variants/{variant}/image':
            case 'DELETE products/{product}/variants/{variant}/image':
                return ['catalog', 'Updated photos of '.$p('product')?->name, $p('product')];
        }

        // plain create / update / delete of a resource
        $segments = explode('/', $uri);
        if (! isset(self::RESOURCES[$segments[0]])) {
            return null;
        }
        [$category, $singular, $attr] = self::RESOURCES[$segments[0]];
        $model = count($segments) > 1 ? $request->route(trim($segments[1], '{}')) : null;
        $name = $model instanceof Model ? $model->getAttribute($attr) : ($created()[$attr] ?? $in($attr));

        return match ($verb) {
            'POST' => [$category, "Added {$singular} “{$name}”", null],
            'PUT', 'PATCH' => [$category, "Edited {$singular} “{$name}”".($request->has('is_active') && ! $in('is_active') ? ' (disabled)' : ''), $model],
            'DELETE' => [$category, "Deleted {$singular} “{$name}”", null],
            default => null,
        };
    }
}
