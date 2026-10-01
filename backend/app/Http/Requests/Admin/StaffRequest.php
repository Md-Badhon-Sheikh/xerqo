<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use App\Support\Phone;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StaffRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeBooleans(['is_active']);
        $this->emptyToNull(['phone', 'password']);

        if ($this->filled('phone')) {
            $this->merge(['phone' => Phone::normalize($this->input('phone'))]);
        }

        if ($this->filled('email')) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        /** @var User|null $staff */
        $staff = $this->route('user');
        $required = $this->isUpdate() ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:100'],
            'email' => [$required, 'email', 'max:255', Rule::unique('users', 'email')->ignore($staff?->id)],
            'phone' => ['nullable', 'string', 'regex:'.Phone::REGEX, Rule::unique('users', 'phone')->ignore($staff?->id)],
            'role_id' => [$required, 'integer', 'exists:roles,id'],
            'is_active' => ['sometimes', 'boolean'],
            'password' => [$this->isUpdate() ? 'nullable' : 'required', 'string', Password::min(8)],
        ];
    }
}
