<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    /**
     * GET /api/admin/roles — roles plus the module/action list for the permissions matrix UI.
     */
    public function index(): AnonymousResourceCollection
    {
        return RoleResource::collection(Role::withCount('users')->orderBy('id')->get())
            ->additional(['matrix' => $this->matrix()]);
    }

    public function store(RoleRequest $request): JsonResponse
    {
        $role = Role::create([
            ...$request->safe()->except('permissions'),
            'permissions' => $request->permissions(),
            'is_system' => false,
        ]);

        return (new RoleResource($role->loadCount('users')))
            ->additional(['matrix' => $this->matrix()])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Role $role): RoleResource
    {
        return (new RoleResource($role->loadCount('users')))->additional(['matrix' => $this->matrix()]);
    }

    public function update(RoleRequest $request, Role $role): RoleResource
    {
        if ($role->isSuperAdmin()) {
            throw ValidationException::withMessages(['role' => 'The Super Admin role always has full access and cannot be edited.']);
        }

        $data = $request->safe()->except('permissions');

        if ($role->is_system) {
            unset($data['slug']); // keep system slugs stable
        }

        if ($request->has('permissions')) {
            $data['permissions'] = $request->permissions();
        }

        $role->update($data);

        return new RoleResource($role->loadCount('users'));
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->is_system) {
            throw ValidationException::withMessages(['role' => 'Built-in roles cannot be deleted.']);
        }

        if ($role->users()->exists()) {
            throw ValidationException::withMessages(['role' => 'Reassign the staff members using this role first.']);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }

    /**
     * @return array{modules: array<int, array{key: string, label: string}>, actions: array<int, string>}
     */
    private function matrix(): array
    {
        return [
            'modules' => collect(Role::MODULES)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values()->all(),
            'actions' => Role::ACTIONS,
        ];
    }
}
