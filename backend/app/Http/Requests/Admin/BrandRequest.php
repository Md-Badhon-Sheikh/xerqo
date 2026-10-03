<?php

namespace App\Http\Requests\Admin;

use App\Models\Brand;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BrandRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeBooleans(['is_active', 'remove_logo']);
        $this->emptyToNull(['description', 'slug']);

        if (! $this->filled('slug') && $this->filled('name')) {
            $this->merge(['slug' => Str::slug($this->input('name'))]);
        }
    }

    public function rules(): array
    {
        /** @var Brand|null $brand */
        $brand = $this->route('brand');
        $required = $this->isUpdate() ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:100'],
            'slug' => [$required, 'string', 'max:120', 'alpha_dash', Rule::unique('brands', 'slug')->ignore($brand?->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_logo' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
