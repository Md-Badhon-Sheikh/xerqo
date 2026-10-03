<?php

namespace App\Support;

/**
 * Works out how many SMS parts a message needs — that is what the operator bills.
 *
 * GSM-7 (plain English): 160 characters in one SMS, 153 per part when longer; ^{}[]~|\€ count double.
 * Unicode (Bangla, curly quotes, ৳ …): 70 characters in one SMS, 67 per part when longer.
 * The storefront admin mirrors this in frontend/src/lib/sms.js.
 */
class SmsSegments
{
    private const GSM_BASIC = "@£\$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

    private const GSM_EXTENDED = "^{}\\[~]|€\f";

    /**
     * @return array{encoding: string, length: int, segments: int, per_segment: int}
     */
    public static function analyse(string $message): array
    {
        $chars = mb_str_split($message);
        $length = 0;
        $gsm = true;

        foreach ($chars as $char) {
            if (str_contains(self::GSM_EXTENDED, $char)) {
                $length += 2;
            } elseif (str_contains(self::GSM_BASIC, $char)) {
                $length++;
            } else {
                $gsm = false;
                break;
            }
        }

        if (! $gsm) {
            // UCS-2 counts UTF-16 code units, so emoji take two
            $length = intdiv(strlen(mb_convert_encoding($message, 'UTF-16BE', 'UTF-8')), 2);
            $single = 70;
            $part = 67;
        } else {
            $single = 160;
            $part = 153;
        }

        $segments = $length === 0 ? 1 : ($length <= $single ? 1 : (int) ceil($length / $part));

        return [
            'encoding' => $gsm ? 'gsm' : 'unicode',
            'length' => $length,
            'segments' => $segments,
            'per_segment' => $segments > 1 ? $part : $single,
        ];
    }
}
