<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class InventoryAdjustRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'variant_id' => [
                'nullable', 'integer',
                Rule::exists('product_variants', 'id')->where('product_id', $this->integer('product_id')),
            ],
            // set: stock = quantity, add: stock += quantity, subtract: stock -= quantity
            'type' => ['required', Rule::in(['set', 'add', 'subtract'])],
            'quantity' => ['required', 'integer', 'min:0', 'max:100000'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
