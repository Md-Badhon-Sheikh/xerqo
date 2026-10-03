<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdatePasswordRequest;
use App\Http\Requests\Customer\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Services\OtpService;
use App\Support\Media;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileController extends Controller
{
    /**
     * GET /api/me
     */
    public function show(Request $request): UserResource
    {
        $user = $request->user()->load('role');

        return (new UserResource($user))->additional([
            // Handy for the admin panel UI: which modules/actions this user may use.
            'permissions' => $user->isStaff()
                ? ($user->isSuperAdmin() ? Role::fullMatrix() : ($user->role->permissions ?? []))
                : (object) [],
        ]);
    }

    /**
     * PUT /api/me
     */
    public function update(UpdateProfileRequest $request, OtpService $otp): UserResource
    {
        $user = $request->user();
        $data = $request->safe()->except(['avatar', 'phone_otp']);

        // changing the login phone number needs the code sent to the new number
        if (isset($data['phone']) && $data['phone'] !== $user->phone) {
            if (! $request->filled('phone_otp')) {
                throw ValidationException::withMessages(['phone_otp' => 'Enter the code we sent to your new number.']);
            }
            $otp->verify($data['phone'], 'phone_change', (string) $request->input('phone_otp'));
            $user->phone_verified_at = now();
        }

        if ($request->hasFile('avatar')) {
            Media::delete($user->avatar);
            $data['avatar'] = Media::store($request->file('avatar'), 'avatars');
        }

        $user->update($data);

        return new UserResource($user->fresh('role'));
    }

    /**
     * PUT /api/me/password — keeps the current token, revokes all other devices.
     */
    /**
     * POST /api/me/phone/otp {"phone": "01812345678"} — code to confirm a new phone number.
     */
    public function phoneOtp(Request $request, OtpService $otp): JsonResponse
    {
        $request->merge(['phone' => Phone::normalize((string) $request->input('phone'))]);
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX, Rule::unique('users', 'phone')->ignore($request->user()->id)],
        ], [
            'phone.regex' => 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).',
            'phone.unique' => 'Another account already uses this number.',
        ]);

        if ($data['phone'] === $request->user()->phone) {
            throw ValidationException::withMessages(['phone' => 'This is already your number.']);
        }

        return response()->json(['message' => 'Code sent to '.$data['phone'].'.', ...$otp->send($data['phone'], 'phone_change', $request->ip())]);
    }

    /**
     * DELETE /api/me {"password": "…"} — closes the account. Past orders stay (without the account link).
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();

        if (! Hash::check((string) $request->input('password'), $user->password)) {
            throw ValidationException::withMessages(['password' => 'Your password is incorrect.']);
        }

        if ($user->isStaff()) {
            throw ValidationException::withMessages(['password' => 'Staff accounts are removed by a Super Admin.']);
        }

        Media::delete($user->avatar);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Your account has been deleted.']);
    }

    public function password(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->validated('current_password'), $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Your current password is incorrect.']);
        }

        $user->forceFill(['password' => Hash::make($request->validated('password'))])->save();

        $current = $user->currentAccessToken();
        $user->tokens()
            ->when($current instanceof PersonalAccessToken, fn ($q) => $q->whereKeyNot($current->getKey()))
            ->delete();

        return response()->json(['message' => 'Password updated.']);
    }
}
