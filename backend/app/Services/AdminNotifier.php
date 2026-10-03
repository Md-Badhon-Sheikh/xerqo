<?php

namespace App\Services;

use App\Mail\StaffAlertMail;
use App\Models\Role;
use App\Models\User;
use App\Notifications\StaffAlert;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Throwable;

/**
 * Alerts the staff who can act on something: in-app (the bell) and, if they chose it, by email.
 * Each event goes to active staff whose role can open the related admin module.
 */
class AdminNotifier
{
    // event => [label, admin module the reader needs, category tab, colour, email on by default]
    public const EVENTS = [
        'new_order' => ['New order', 'orders', 'orders', 'tan', false],
        'payment' => ['Payment to verify', 'payments', 'orders', 'green', false],
        'review' => ['New review', 'reviews', 'reviews', 'amber', false],
        'return' => ['Return request', 'returns', 'returns', 'amber', false],
        'low_stock' => ['Low stock', 'inventory', 'stock', 'red', false],
        'sms_balance' => ['SMS balance low', null, 'system', 'red', false], // Super Admins only (they also get the low-balance email)
    ];

    public function notify(string $event, string $title, string $body, string $link): void
    {
        if (! isset(self::EVENTS[$event])) {
            return;
        }

        try {
            [, $module, $category, $tone] = self::EVENTS[$event];
            $payload = compact('event', 'category', 'title', 'body', 'link', 'tone');

            $staff = User::staff()->where('is_active', true)->with('role')->get()
                ->filter(fn (User $u) => $module ? (bool) $u->role?->allows($module) : $u->isSuperAdmin());

            $inApp = $staff->filter(fn (User $u) => self::wants($u, $event, 'app'));
            if ($inApp->isNotEmpty()) {
                Notification::send($inApp, new StaffAlert($payload));
            }

            foreach ($staff->filter(fn (User $u) => $u->email && self::wants($u, $event, 'email')) as $user) {
                Mail::to($user->email)->queue(new StaffAlertMail($payload));
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    public static function wants(User $user, string $event, string $channel): bool
    {
        $default = $channel === 'app' ? true : (bool) (self::EVENTS[$event][4] ?? false);

        return (bool) data_get($user->notification_prefs, "{$event}.{$channel}", $default);
    }

    /**
     * Preferences for the events this user can receive.
     *
     * @return array<int, array{event: string, label: string, app: bool, email: bool}>
     */
    public static function preferencesFor(User $user): array
    {
        return collect(self::EVENTS)
            ->filter(fn ($e) => $e[1] ? (bool) $user->role?->allows($e[1]) : $user->isSuperAdmin())
            ->map(fn ($e, $event) => ['event' => $event, 'label' => $e[0], 'app' => self::wants($user, $event, 'app'), 'email' => self::wants($user, $event, 'email')])
            ->values()->all();
    }
}
