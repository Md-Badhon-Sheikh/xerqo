<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StaffRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Staff = users with a role. Route parameter: {user}.
 */
class StaffController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $staff = User::staff()
            ->with('role')
            ->when($request->filled('role_id'), fn ($q) => $q->where('role_id', $request->integer('role_id')))
            ->orderBy('name')
            ->get();

        return UserResource::collection($staff);
    }

    public function store(StaffRequest $request): JsonResponse
    {
        $data = $request->validated();
        $this->guardSuperAdminRole($request, (int) $data['role_id']);

        $user = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return (new UserResource($user->load('role')))->response()->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        abort_unless($user->isStaff(), 404);

        return new UserResource($user->load('role'));
    }

    public function update(StaffRequest $request, User $user): UserResource
    {
        abort_unless($user->isStaff(), 404);

        $data = $request->validated();

        if (isset($data['role_id'])) {
            $this->guardSuperAdminRole($request, (int) $data['role_id']);
        }

        $changesOwnRole = isset($data['role_id']) && (int) $data['role_id'] !== (int) $user->role_id;
        if ($user->is($request->user()) && ($changesOwnRole || ($data['is_active'] ?? true) === false)) {
            throw ValidationException::withMessages(['role_id' => 'You cannot change your own role or deactivate yourself.']);
        }

        if ($user->isSuperAdmin() && ! $request->user()->isSuperAdmin()) {
            abort(403, 'Only a Super Admin can edit another Super Admin.');
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        if (($data['is_active'] ?? true) === false) {
            $user->tokens()->delete();
        }

        return new UserResource($user->load('role'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless($user->isStaff(), 404);

        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['user' => 'You cannot delete your own account.']);
        }

        if ($user->isSuperAdmin()) {
            $superAdmins = User::whereHas('role', fn ($q) => $q->where('slug', Role::SUPER_ADMIN))->count();

            if ($superAdmins <= 1 || ! $request->user()->isSuperAdmin()) {
                throw ValidationException::withMessages(['user' => 'This Super Admin cannot be deleted.']);
            }
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Staff member removed.']);
    }

    /**
     * Only a Super Admin may grant the Super Admin role.
     */
    private function guardSuperAdminRole(Request $request, int $roleId): void
    {
        $role = Role::find($roleId);

        if ($role?->isSuperAdmin() && ! $request->user()->isSuperAdmin()) {
            abort(403, 'Only a Super Admin can assign the Super Admin role.');
        }
    }
}
