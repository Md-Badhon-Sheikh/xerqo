<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StaffRequest;
use App\Http\Resources\UserResource;
use App\Mail\StaffInvite;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

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

    /**
     * POST /api/admin/staff — without a password the new member gets an invite email and sets their own.
     */
    public function store(StaffRequest $request): JsonResponse
    {
        $data = $request->validated();
        $this->guardSuperAdminRole($request, (int) $data['role_id']);
        $invite = empty($data['password']) || $request->boolean('send_invite');

        $user = User::create([
            ...collect($data)->except('send_invite')->all(),
            'password' => Hash::make($data['password'] ?? Str::random(40)),
            'is_active' => $data['is_active'] ?? true,
        ]);

        if ($invite) {
            $this->sendInvite($user->load('role'), $request->user());
        }

        return (new UserResource($user->load('role')))
            ->additional(['message' => $invite ? "Invite sent to {$user->email}." : 'Staff member added.'])
            ->response()->setStatusCode(201);
    }

    /**
     * POST /api/admin/staff/{user}/invite — send the "set your password" email again.
     */
    public function invite(Request $request, User $user): JsonResponse
    {
        abort_unless($user->isStaff(), 404);

        $this->sendInvite($user->load('role'), $request->user());

        return response()->json(['message' => "Invite sent to {$user->email}."]);
    }

    private function sendInvite(User $user, User $by): void
    {
        try {
            Mail::to($user->email)->queue(new StaffInvite($user, $by->name));
        } catch (Throwable $e) {
            Log::error('[Mail] staff invite to '.$user->email.' failed: '.$e->getMessage());
        }
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
