<?php

namespace App\Http\Requests\Customer;

use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;

class AddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $this->merge(['phone' => Phone::normalize($this->input('phone'))]);
        }
    }

    public function rules(): array
    {
        // PUT/PATCH may send only the changed fields.
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'label' => ['nullable', 'string', 'max:50'],
            'name' => [$required, 'string', 'max:100'],
            'phone' => [$required, 'string', 'regex:'.Phone::REGEX],
            'district' => [$required, 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100'],
            'address_line' => [$required, 'string', 'max:500'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
