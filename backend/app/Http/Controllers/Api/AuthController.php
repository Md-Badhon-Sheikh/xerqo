<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Mail\PasswordResetCode;
use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\OtpService;
use App\Services\SmsService;
use App\Support\Activity;
use App\Support\Device;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;
use Throwable;

class AuthController extends Controller
{
    private const OTP_TTL_MINUTES = 10;

    /**
     * POST /api/auth/register
     */
    public function register(RegisterRequest $request, OtpService $otp): JsonResponse
    {
        $data = $request->validated();

        if (! empty($data['otp'])) {
            $otp->verify($data['phone'], 'register', $data['otp']);
        }

        $user = User::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'password' => Hash::make($data['password']), // bcrypt (config/hashing.php)
            'is_active' => true,
            'marketing_sms' => (bool) ($data['marketing_sms'] ?? false),
        ]);

        if (! empty($data['otp'])) {
            $user->forceFill(['phone_verified_at' => now()])->save();
        }
        $user->refresh(); // load column defaults (notification preferences)

        $token = $this->issueToken($user, $data['device_name'] ?? null);

        return $this->tokenResponse($user, $token, 201);
    }

    /**
     * POST /api/auth/login  — email or mobile number + password.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $login = $request->validated('login');
        $user = $this->findUserByIdentifier($login);

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            if ($user?->isStaff()) {
                Activity::log('auth.login_failed', 'auth', 'Failed sign-in (wrong password)', $user, [], $user);
            }

            throw ValidationException::withMessages([
                'login' => 'These credentials do not match our records.',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => 'Your account has been disabled. Please contact support.',
            ]);
        }

        if (Hash::needsRehash($user->password)) {
            $user->password = Hash::make($request->validated('password'));
        }

        $user->last_login_at = now();
        $user->save();

        $token = $this->issueToken($user, $request->validated('device_name'));

        if ($user->isStaff()) {
            Activity::log('auth.login', 'auth', 'Signed in', $user, [], $user);
        }

        return $this->tokenResponse($user, $token);
    }

    /**
     * POST /api/auth/otp/send {"phone": "01712345678", "purpose": "login|register"}
     * Login needs an existing active account; registration needs an unused number.
     */
    public function sendOtp(Request $request, OtpService $otp): JsonResponse
    {
        $request->merge(['phone' => Phone::normalize((string) $request->input('phone'))]);
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX],
            'purpose' => ['required', 'in:login,register'],
        ], ['phone.regex' => 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).']);

        $user = User::where('phone', $data['phone'])->first();

        if ($data['purpose'] === 'login' && (! $user || ! $user->is_active)) {
            throw ValidationException::withMessages(['phone' => $user
                ? 'This account has been disabled. Please contact support.'
                : 'No account uses this number yet. Create an account instead.']);
        }

        if ($data['purpose'] === 'register' && $user) {
            throw ValidationException::withMessages(['phone' => 'An account with this mobile number already exists. Sign in instead.']);
        }

        return response()->json([
            'message' => 'We sent a 6-digit code to '.$data['phone'].'.',
            ...$otp->send($data['phone'], $data['purpose'], $request->ip()),
        ]);
    }

    /**
     * POST /api/auth/otp/register {"name", "phone", "otp", "marketing_sms"?} — sign up with a mobile number only.
     * The SMS code proves the number; no password (the customer signs in with a code, Google, or sets a
     * password later through "Forgot password").
     */
    public function otpRegister(Request $request, OtpService $otp): JsonResponse
    {
        $request->merge(['phone' => Phone::normalize((string) $request->input('phone'))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX, 'unique:users,phone'],
            'otp' => ['required', 'string', 'digits:6'],
            'marketing_sms' => ['sometimes', 'boolean'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ], [
            'phone.regex' => 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).',
            'phone.unique' => 'An account with this mobile number already exists. Sign in instead.',
            'otp.required' => 'Enter the 6-digit code we sent to your phone.',
        ]);

        $otp->verify($data['phone'], 'register', $data['otp']);

        $user = User::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            'password' => Hash::make(Str::random(40)),
            'is_active' => true,
            'marketing_sms' => (bool) ($data['marketing_sms'] ?? false),
        ]);
        $user->forceFill(['phone_verified_at' => now(), 'last_login_at' => now()])->save();
        $user->refresh();

        return $this->tokenResponse($user, $this->issueToken($user, $data['device_name'] ?? null), 201);
    }

    /**
     * POST /api/auth/otp/login {"phone": "01712345678", "otp": "123456"}
     */
    public function otpLogin(Request $request, OtpService $otp): JsonResponse
    {
        $request->merge(['phone' => Phone::normalize((string) $request->input('phone'))]);
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX],
            'otp' => ['required', 'string', 'digits:6'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $otp->verify($data['phone'], 'login', $data['otp']);

        $user = User::where('phone', $data['phone'])->first();
        if (! $user || ! $user->is_active) {
            throw ValidationException::withMessages(['phone' => 'This account is not available.']);
        }

        $user->forceFill([
            'last_login_at' => now(),
            'phone_verified_at' => $user->phone_verified_at ?? now(),
        ])->save();

        return $this->tokenResponse($user, $this->issueToken($user, $data['device_name'] ?? null));
    }

    /**
     * POST /api/auth/google {"credential": "<Google ID token>"} — "Continue with Google" for customers.
     * Signs in the account with this Google ID or email, or creates a new customer account.
     */
    public function google(Request $request): JsonResponse
    {
        $data = $request->validate([
            'credential' => ['required', 'string', 'max:4096'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $clientId = config('services.google.client_id');
        abort_unless($clientId, 404, 'Google sign-in is not set up.');

        // Google checks the token's signature and expiry; we check it was issued for this site
        try {
            $info = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $data['credential']]);
        } catch (Throwable $e) {
            report($e);
            throw ValidationException::withMessages(['credential' => 'Could not reach Google. Please try again.']);
        }
        $claims = $info->ok() ? $info->json() : [];

        $valid = ($claims['aud'] ?? null) === $clientId
            && in_array($claims['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true)
            && filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)
            && ! empty($claims['sub']) && ! empty($claims['email']);

        if (! $valid) {
            throw ValidationException::withMessages(['credential' => 'Google sign-in failed. Please try again.']);
        }

        $email = strtolower($claims['email']);
        $user = User::where('google_id', $claims['sub'])->first() ?? User::where('email', $email)->first();

        if ($user?->isStaff()) {
            throw ValidationException::withMessages(['credential' => 'Staff accounts sign in from the admin login page.']);
        }
        if ($user && ! $user->is_active) {
            throw ValidationException::withMessages(['credential' => 'Your account has been disabled. Please contact support.']);
        }

        if (! $user) {
            $user = User::create([
                'name' => $claims['name'] ?? strstr($email, '@', true),
                'email' => $email,
                'password' => Hash::make(Str::random(40)), // signs in with Google; can set a password via "Forgot password"
                'is_active' => true,
            ]);
        }

        $user->forceFill([
            'google_id' => $user->google_id ?? $claims['sub'],
            'email_verified_at' => $user->email_verified_at ?? now(),
            'last_login_at' => now(),
        ])->save();

        return $this->tokenResponse($user, $this->issueToken($user, $data['device_name'] ?? null), $user->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * POST /api/auth/logout — revokes the token used for this request.
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * POST /api/auth/forgot-password — sends a 6-digit OTP (stored hashed, valid 10 minutes).
     */
    public function forgotPassword(ForgotPasswordRequest $request, SmsService $sms): JsonResponse
    {
        $identifier = $request->validated('identifier');
        $user = $this->findUserByIdentifier($identifier);
        $response = [
            'message' => 'If an account exists for this number or email, an OTP has been sent.',
            'expires_in' => self::OTP_TTL_MINUTES * 60,
        ];

        if (! $user || ! $user->is_active) {
            return response()->json($response);
        }

        $otp = (string) random_int(100000, 999999);

        DB::transaction(function () use ($user, $otp) {
            PasswordResetOtp::where('user_id', $user->id)->delete();

            PasswordResetOtp::create([
                'user_id' => $user->id,
                'identifier' => $this->identifierKey($user),
                'otp_hash' => Hash::make($otp),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
            ]);
        });

        // the code goes where the person asked for it: an email address gets an email, a number an SMS
        if ($user->email && (! Phone::looksLikePhone($identifier) || ! $user->phone)) {
            try {
                Mail::to($user->email)->send(new PasswordResetCode($user->name, $otp, self::OTP_TTL_MINUTES));
            } catch (Throwable $e) {
                Log::error('[Mail] password reset code to '.$user->email.' failed: '.$e->getMessage());
            }
        } elseif ($user->phone) {
            $sent = $sms->sendTemplate($user->phone, 'password_otp', [
                'otp' => $otp,
                'minutes' => self::OTP_TTL_MINUTES,
            ]);

            if (! $sent) {
                $sms->send($user->phone, "Your XERQO password reset code is {$otp}. It expires in ".self::OTP_TTL_MINUTES.' minutes.');
            }
        }

        // Local development convenience only — never exposed when APP_DEBUG=false.
        if (config('app.debug')) {
            $response['debug_otp'] = $otp;
        }

        return response()->json($response);
    }

    /**
     * POST /api/auth/reset-password — identifier + otp + new password.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $this->findUserByIdentifier($data['identifier']);
        $record = $user
            ? PasswordResetOtp::where('user_id', $user->id)->latest('id')->first()
            : null;

        if (! $record || ! $record->isUsable()) {
            throw ValidationException::withMessages(['otp' => 'This code has expired. Please request a new one.']);
        }

        if (! Hash::check($data['otp'], $record->otp_hash)) {
            $record->increment('attempts');

            throw ValidationException::withMessages(['otp' => 'The code you entered is incorrect.']);
        }

        DB::transaction(function () use ($user, $data) {
            $user->forceFill(['password' => Hash::make($data['password'])])->save();
            PasswordResetOtp::where('user_id', $user->id)->delete();
            // Sign out every device.
            $user->tokens()->delete();
        });

        return response()->json(['message' => 'Your password has been reset. Please log in.']);
    }

    /**
     * A new API token, tagged with the device and IP so people can recognise (and revoke) their sessions.
     */
    private function issueToken(User $user, ?string $name = null): string
    {
        // forget sessions nobody has used for a month, so the devices list stays meaningful
        $user->tokens()->where(fn ($q) => $q->where('last_used_at', '<', now()->subDays(30))
            ->orWhere(fn ($q) => $q->whereNull('last_used_at')->where('created_at', '<', now()->subDays(30))))->delete();

        $new = $user->createToken($name ?: 'xerqo-spa');
        $new->accessToken->forceFill([
            'ip' => request()->ip(),
            'device' => Device::describe(request()->userAgent()),
        ])->save();

        return $new->plainTextToken;
    }

    private function findUserByIdentifier(string $identifier): ?User
    {
        if (Phone::looksLikePhone($identifier)) {
            return User::where('phone', Phone::normalize($identifier))->first();
        }

        return User::where('email', strtolower($identifier))->first();
    }

    private function identifierKey(User $user): string
    {
        return $user->phone ?? (string) $user->email;
    }

    private function tokenResponse(User $user, string $token, int $status = 200): JsonResponse
    {
        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load('role')),
        ], $status);
    }
}
