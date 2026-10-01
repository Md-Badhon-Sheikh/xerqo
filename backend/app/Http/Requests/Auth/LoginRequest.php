<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Accepts {"login": "..."} or the React client's {"email": "..."} / {"phone": "..."}.
 * The value may be an email address or a mobile number.
 */
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $login = $this->input('login') ?? $this->input('email') ?? $this->input('phone');

        $this->merge(['login' => is_string($login) ? trim($login) : $login]);
    }

    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'login.required' => 'Enter your email or mobile number.',
        ];
    }
}
