<?php

namespace App\Http\Requests\Auth;

use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends ForgotPasswordRequest
{
    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:255'],
            'otp' => ['required', 'digits:6'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }
}
