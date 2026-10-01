<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $identifier = $this->input('identifier') ?? $this->input('phone') ?? $this->input('email') ?? $this->input('login');

        $this->merge(['identifier' => is_string($identifier) ? trim($identifier) : $identifier]);
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'identifier.required' => 'Enter your mobile number or email.',
        ];
    }
}
