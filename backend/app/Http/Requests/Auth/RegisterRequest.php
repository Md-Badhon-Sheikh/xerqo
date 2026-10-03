<?php

namespace App\Http\Requests\Auth;

use App\Models\Setting;
use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'phone' => Phone::normalize($this->input('phone')),
            'email' => $this->filled('email') ? strtolower(trim($this->input('email'))) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX, 'unique:users,phone'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'device_name' => ['nullable', 'string', 'max:100'],
            // SMS code proving the phone belongs to the customer (required while settings auth.register_otp is on)
            'otp' => [Setting::getValue('auth.register_otp', true) ? 'required' : 'nullable', 'string', 'digits:6'],
            'marketing_sms' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).',
            'phone.unique' => 'An account with this mobile number already exists.',
            'email.unique' => 'An account with this email already exists.',
            'otp.required' => 'Enter the 6-digit code we sent to your phone.',
            'otp.digits' => 'The code has 6 digits.',
        ];
    }
}
