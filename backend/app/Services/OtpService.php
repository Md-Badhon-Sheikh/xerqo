<?php

namespace App\Services;

use App\Models\OtpCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * 6-digit SMS codes for login, registration and phone changes.
 * Codes are stored hashed, expire after 5 minutes, allow 5 tries, and can be re-sent every 60 seconds
 * (at most 5 per number per hour).
 */
class OtpService
{
    public const TTL_MINUTES = 5;

    public const RESEND_SECONDS = 60;

    private const HOURLY_LIMIT = 5;

    private const MESSAGES = [
        'login' => 'Your XERQO login code is :code. It expires in :minutes minutes. Do not share it with anyone.',
        'register' => 'Your XERQO verification code is :code. It expires in :minutes minutes.',
        'phone_change' => 'Your XERQO code to confirm this number is :code. It expires in :minutes minutes.',
    ];

    public function __construct(private SmsService $sms) {}

    /**
     * Create and send a code. Returns ['expires_in' => seconds, 'resend_in' => seconds, 'debug_otp' => only when APP_DEBUG].
     *
     * @return array<string, int|string>
     */
    public function send(string $phone, string $purpose, ?string $ip = null): array
    {
        $last = OtpCode::where(['identifier' => $phone, 'purpose' => $purpose])->latest('id')->first();
        if ($last && $last->created_at->diffInSeconds(now()) < self::RESEND_SECONDS) {
            $wait = self::RESEND_SECONDS - (int) $last->created_at->diffInSeconds(now());
            throw ValidationException::withMessages(['phone' => "Please wait {$wait} seconds before requesting another code."]);
        }

        $recent = OtpCode::where('identifier', $phone)->where('created_at', '>=', now()->subHour())->count();
        if ($recent >= self::HOURLY_LIMIT) {
            throw ValidationException::withMessages(['phone' => 'Too many codes requested for this number. Please try again in an hour.']);
        }

        $code = (string) random_int(100000, 999999);

        OtpCode::where(['identifier' => $phone, 'purpose' => $purpose])->whereNull('consumed_at')->update(['consumed_at' => now()]);
        OtpCode::create([
            'identifier' => $phone,
            'purpose' => $purpose,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
            'ip' => $ip,
        ]);

        $sent = $this->sms->send($phone, strtr(self::MESSAGES[$purpose] ?? self::MESSAGES['login'], [
            ':code' => $code,
            ':minutes' => self::TTL_MINUTES,
        ]));

        if (! $sent) {
            throw ValidationException::withMessages(['phone' => 'We could not send the SMS right now. Please try again shortly or sign in with your password.']);
        }

        return [
            'expires_in' => self::TTL_MINUTES * 60,
            'resend_in' => self::RESEND_SECONDS,
            // local development only — never present when APP_DEBUG=false
            ...(config('app.debug') ? ['debug_otp' => $code] : []),
        ];
    }

    /**
     * Check a code; a correct code is consumed. Throws a validation error on the "otp" field otherwise.
     */
    public function verify(string $phone, string $purpose, string $code): void
    {
        $otp = OtpCode::where(['identifier' => $phone, 'purpose' => $purpose])->latest('id')->first();

        if (! $otp || ! $otp->isUsable()) {
            throw ValidationException::withMessages(['otp' => 'This code has expired. Please request a new one.']);
        }

        if (! Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');
            $left = OtpCode::MAX_ATTEMPTS - $otp->attempts;

            throw ValidationException::withMessages(['otp' => $left > 0
                ? "The code is incorrect. {$left} ".($left === 1 ? 'try' : 'tries').' left.'
                : 'Too many wrong tries. Please request a new code.']);
        }

        $otp->update(['consumed_at' => now()]);
    }
}
