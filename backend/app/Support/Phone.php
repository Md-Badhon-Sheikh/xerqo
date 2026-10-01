<?php

namespace App\Support;

class Phone
{
    /**
     * Bangladeshi mobile number in local format: 01XXXXXXXXX (11 digits).
     */
    public const REGEX = '/^01[3-9]\d{8}$/';

    /**
     * Normalise "+880 1712-345678", "8801712345678", "01712 345678" to "01712345678".
     */
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return $phone;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        // Strip the +88 country code: 8801712345678 -> 01712345678
        if (str_starts_with($digits, '880') && strlen($digits) === 13) {
            $digits = substr($digits, 2);
        }

        return $digits;
    }

    public static function isValid(?string $phone): bool
    {
        return $phone !== null && preg_match(self::REGEX, $phone) === 1;
    }

    /**
     * Whether the given login identifier looks like a phone number (not an email).
     */
    public static function looksLikePhone(string $identifier): bool
    {
        return ! str_contains($identifier, '@');
    }
}
