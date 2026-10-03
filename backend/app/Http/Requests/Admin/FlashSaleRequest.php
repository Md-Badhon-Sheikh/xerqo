<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Validation\Validator;

class FlashSaleRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeBooleans(['is_active']);
    }

    public function rules(): array
    {
        $required = $this->isUpdate() ? 'sometimes' : 'required';

        return [
            'title' => [$required, 'string', 'max:120'],
            'starts_at' => [$required, 'date'],
            'ends_at' => [$required, 'date', 'after:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
            // the complete product list of the sale (replaces the current list)
            'items' => [$required, 'array', 'min:1', 'max:100'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.sale_price' => ['required', 'numeric', 'min:1'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $items = $this->input('items');
                if (! is_array($items) || $validator->errors()->isNotEmpty()) {
                    return;
                }

                // a sale price has to be lower than the regular price
                $prices = Product::whereIn('id', array_column($items, 'product_id'))->pluck('price', 'id');
                foreach (array_values($items) as $i => $item) {
                    $regular = $prices[$item['product_id']] ?? null;
                    if ($regular !== null && (float) $item['sale_price'] >= (float) $regular) {
                        $validator->errors()->add("items.{$i}.sale_price", 'Sale price must be lower than the regular price ('.number_format((float) $regular).').');
                    }
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'ends_at.after' => 'The sale must end after it starts.',
            'items.required' => 'Add at least one product to the sale.',
            'items.min' => 'Add at least one product to the sale.',
            'items.*.product_id.distinct' => 'This product is already in the sale.',
        ];
    }
}
