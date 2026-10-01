<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeBooleans(['is_active']);
        $this->emptyToNull(['parent_id', 'description', 'slug']);

        if (! $this->isUpdate() && ! $this->filled('slug') && $this->filled('name')) {
            $this->merge(['slug' => Str::slug($this->input('name'))]);
        }
    }

    public function rules(): array
    {
        /** @var Category|null $category */
        $category = $this->route('category');
        $required = $this->isUpdate() ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:100'],
            'slug' => [$required, 'string', 'max:120', 'alpha_dash', Rule::unique('categories', 'slug')->ignore($category?->id)],
            'parent_id' => [
                'nullable', 'integer', 'exists:categories,id',
                Rule::notIn(array_filter([$category?->id])),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
