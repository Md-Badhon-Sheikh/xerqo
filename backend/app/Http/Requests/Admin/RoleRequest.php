<?php

namespace App\Http\Requests\Admin;

use App\Models\Role;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * permissions: {"orders": ["view", "edit"], "products": ["view", "create", "edit", "delete"], ...}
 */
class RoleRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        if (! $this->isUpdate() && ! $this->filled('slug') && $this->filled('name')) {
            $this->merge(['slug' => Str::slug($this->input('name'))]);
        }
    }

    public function rules(): array
    {
        /** @var Role|null $role */
        $role = $this->route('role');
        $required = $this->isUpdate() ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:100'],
            'slug' => [$required, 'string', 'max:100', 'alpha_dash', Rule::unique('roles', 'slug')->ignore($role?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['array'],
            'permissions.*.*' => [Rule::in(Role::ACTIONS)],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $unknown = array_diff(array_keys((array) $this->input('permissions', [])), array_keys(Role::MODULES));

            if ($unknown !== []) {
                $validator->errors()->add('permissions', 'Unknown module(s): '.implode(', ', $unknown).'.');
            }
        });
    }

    /**
     * Permissions with duplicate actions removed.
     *
     * @return array<string, array<int, string>>
     */
    public function permissions(): array
    {
        return collect((array) $this->validated('permissions', []))
            ->map(fn ($actions) => array_values(array_unique((array) $actions)))
            ->all();
    }
}
