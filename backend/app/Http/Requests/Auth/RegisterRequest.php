<?php

namespace App\Http\Requests\Auth;

use App\Models\Setting;
use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
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
            'phone' => $this->filled('phone') ? Phone::normalize($this->input('phone')) : null,
            'email' => $this->filled('email') ? strtolower(trim($this->input('email'))) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            // sign up with a mobile number or with an email address (or both)
            'phone' => ['nullable', 'required_without:email', 'string', 'regex:'.Phone::REGEX, 'unique:users,phone'],
            'email' => ['nullable', 'required_without:phone', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'device_name' => ['nullable', 'string', 'max:100'],
            // SMS code proving the phone belongs to the customer (required while settings auth.register_otp is on)
            'otp' => [Rule::requiredIf(fn () => $this->filled('phone') && Setting::getValue('auth.register_otp', true)), 'nullable', 'string', 'digits:6'],
            'marketing_sms' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).',
            'phone.unique' => 'An account with this mobile number already exists.',
            'phone.required_without' => 'Enter your mobile number or email.',
            'email.required_without' => 'Enter your email address.',
            'email.unique' => 'An account with this email already exists.',
            'otp.required' => 'Enter the 6-digit code we sent to your phone.',
            'otp.digits' => 'The code has 6 digits.',
        ];
    }
}
