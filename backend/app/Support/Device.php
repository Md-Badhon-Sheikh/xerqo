<?php

namespace App\Support;

/**
 * "Chrome · Windows" from a user agent — enough to recognise a device in the sessions list.
 */
class Device
{
    public static function describe(?string $agent): string
    {
        if (blank($agent)) {
            return 'Unknown device';
        }

        $browser = match (true) {
            str_contains($agent, 'Edg/') => 'Edge',
            str_contains($agent, 'OPR/') || str_contains($agent, 'Opera') => 'Opera',
            str_contains($agent, 'SamsungBrowser') => 'Samsung Internet',
            str_contains($agent, 'Firefox/') => 'Firefox',
            str_contains($agent, 'Chrome/') || str_contains($agent, 'CriOS') => 'Chrome',
            str_contains($agent, 'Safari/') => 'Safari',
            default => 'Browser',
        };

        $os = match (true) {
            str_contains($agent, 'Android') => 'Android',
            str_contains($agent, 'iPhone') => 'iPhone',
            str_contains($agent, 'iPad') => 'iPad',
            str_contains($agent, 'Windows') => 'Windows',
            str_contains($agent, 'Mac OS') => 'macOS',
            str_contains($agent, 'Linux') => 'Linux',
            default => 'Other',
        };

        return "{$browser} · {$os}";
    }

    public static function kind(?string $device): string
    {
        return match (true) {
            str_contains((string) $device, 'iPad') => 'tablet',
            str_contains((string) $device, 'Android') || str_contains((string) $device, 'iPhone') => 'phone',
            default => 'desktop',
        };
    }
}
