<?php

namespace App\Http\Requests\Customer;

use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('phone')) {
            $data['phone'] = Phone::normalize($this->input('phone'));
        }

        if ($this->has('email')) {
            $data['email'] = $this->filled('email') ? strtolower(trim($this->input('email'))) : null;
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'phone' => ['sometimes', 'required', 'string', 'regex:'.Phone::REGEX, Rule::unique('users', 'phone')->ignore($userId)],
            'email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            // Send as multipart/form-data with _method=PUT when uploading an avatar.
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            // a new phone number must be confirmed with the code sent to it (POST /me/phone/otp)
            'phone_otp' => ['nullable', 'string', 'digits:6'],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today', 'after:1900-01-01'],
            'notify_order_sms' => ['sometimes', 'boolean'],
            'marketing_sms' => ['sometimes', 'boolean'],
            'marketing_email' => ['sometimes', 'boolean'],
        ];
    }
}
