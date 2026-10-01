<?php

namespace App\Http\Requests\Customer;

use App\Models\ReturnRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'order_number' => ['required_without:order_id', 'nullable', 'string', 'max:20'],
            'order_id' => ['required_without:order_number', 'nullable', 'integer'],
            'order_item_id' => ['required', 'integer'],
            'qty' => ['nullable', 'integer', 'min:1'],
            'reason' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string', 'max:2000'],
            'resolution' => ['required', Rule::in(ReturnRequest::RESOLUTIONS)],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];
    }
}
