<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\OtpService;
use App\Services\SmsService;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

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

        $token = $user->createToken($data['device_name'] ?? 'xerqo-spa')->plainTextToken;

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

        $token = $user->createToken($request->validated('device_name') ?? 'xerqo-spa')->plainTextToken;

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

        return $this->tokenResponse($user, $user->createToken($data['device_name'] ?? 'xerqo-spa')->plainTextToken);
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

        if ($user->phone) {
            $sent = $sms->sendTemplate($user->phone, 'password_otp', [
                'otp' => $otp,
                'minutes' => self::OTP_TTL_MINUTES,
            ]);

            if (! $sent) {
                $sms->send($user->phone, "Your XERQO password reset code is {$otp}. It expires in ".self::OTP_TTL_MINUTES.' minutes.');
            }
        } else {
            // Email-only account: plug a Mailable in here. Logged for now.
            Log::info("[OTP] Password reset code for {$user->email}: {$otp}");
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
