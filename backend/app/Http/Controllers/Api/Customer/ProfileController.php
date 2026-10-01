<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdatePasswordRequest;
use App\Http\Requests\Customer\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $data = $request->safe()->except('avatar');

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
