<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Support\Activity;
use App\Support\Device;
use App\Support\Media;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * The signed-in staff member's own account: details, photo, password and devices.
 */
class ProfileController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load('role'));
    }

    /**
     * PUT /api/admin/profile {"name", "email", "phone"}
     */
    public function update(Request $request): UserResource
    {
        $user = $request->user();
        if ($request->filled('phone')) {
            $request->merge(['phone' => Phone::normalize((string) $request->input('phone'))]);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'regex:'.Phone::REGEX, Rule::unique('users', 'phone')->ignore($user->id)],
        ], ['phone.regex' => 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).']);

        $user->update([...$data, 'email' => strtolower($data['email'])]);
        Activity::log('profile.update', 'staff', 'Updated their profile');

        return new UserResource($user->load('role'));
    }

    /**
     * PUT /api/admin/profile/password {"current_password", "password", "password_confirmation"} — signs out other devices.
     */
    public function password(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::min(8), 'different:current_password'],
        ], ['password.different' => 'Choose a password you haven’t used here.']);

        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Your current password is incorrect.']);
        }

        $user->forceFill(['password' => Hash::make($data['password'])])->save();
        $signedOut = $this->otherTokens($request)->delete();
        Activity::log('profile.password', 'auth', 'Changed their password');

        return response()->json(['message' => 'Password updated'.($signedOut ? " · signed out of {$signedOut} other device".($signedOut > 1 ? 's' : '') : '').'.']);
    }

    /**
     * POST /api/admin/profile/avatar (multipart "avatar") · DELETE removes it.
     */
    public function avatar(Request $request): UserResource
    {
        $user = $request->user();

        if ($request->isMethod('DELETE')) {
            Media::delete($user->avatar);
            $user->update(['avatar' => null]);

            return new UserResource($user->load('role'));
        }

        $request->validate(['avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048']]);
        Media::delete($user->avatar);
        $user->update(['avatar' => Media::store($request->file('avatar'), 'avatars')]);

        return new UserResource($user->load('role'));
    }

    /**
     * GET /api/admin/profile/sessions — this account's signed-in devices.
     */
    public function sessions(Request $request): JsonResponse
    {
        $current = $this->currentTokenId($request);

        return response()->json([
            'data' => $request->user()->tokens()->latest('last_used_at')->latest('id')->get()->map(fn (PersonalAccessToken $t) => [
                'id' => $t->id,
                'device' => $t->device ?? 'Unknown device',
                'kind' => Device::kind($t->device),
                'ip' => $t->ip,
                'current' => $t->id === $current,
                'last_used_at' => ($t->last_used_at ?? $t->created_at)?->toIso8601String(),
                'created_at' => $t->created_at?->toIso8601String(),
            ]),
        ]);
    }

    /**
     * DELETE /api/admin/profile/sessions/{id} — sign out one device; DELETE …/sessions signs out all others.
     */
    public function revoke(Request $request, ?int $id = null): JsonResponse
    {
        if ($id === null) {
            $n = $this->otherTokens($request)->delete();

            return response()->json(['message' => "Signed out of {$n} other device".($n === 1 ? '' : 's').'.']);
        }

        abort_if($id === $this->currentTokenId($request), 422, 'Use “Log out” to sign out of this device.');
        $request->user()->tokens()->whereKey($id)->delete();

        return response()->json(['message' => 'Device signed out.']);
    }

    private function currentTokenId(Request $request): ?int
    {
        $token = $request->user()->currentAccessToken();

        return $token instanceof PersonalAccessToken ? $token->id : null;
    }

    private function otherTokens(Request $request)
    {
        return $request->user()->tokens()->when($this->currentTokenId($request), fn ($q, $id) => $q->whereKeyNot($id));
    }
}
