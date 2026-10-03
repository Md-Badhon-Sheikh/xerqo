<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeBooleans(['is_engravable', 'is_featured']);
        $this->emptyToNull(['compare_price', 'cost', 'description', 'badge', 'meta_title', 'meta_description', 'slug', 'brand_id']);

        if (! $this->isUpdate() && ! $this->filled('slug') && $this->filled('name')) {
            $this->merge(['slug' => Str::slug($this->input('name'))]);
        }

        if ($this->filled('sku')) {
            $this->merge(['sku' => strtoupper(trim($this->input('sku')))]);
        }
    }

    public function attributes(): array
    {
        return [
            'sku' => 'SKU',
            'category_id' => 'category',
            'brand_id' => 'brand',
            'variants.*.name' => 'colour name',
            'variants.*.sku' => 'colour SKU',
            'variants.*.color_hex' => 'colour code',
            'variants.*.stock' => 'colour stock',
        ];
    }

    public function rules(): array
    {
        /** @var Product|null $product */
        $product = $this->route('product');
        $required = $this->isUpdate() ? 'sometimes' : 'required';

        return [
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'is_featured' => ['sometimes', 'boolean'],
            'name' => [$required, 'string', 'max:255'],
            'slug' => [$required, 'string', 'max:255', 'alpha_dash', Rule::unique('products', 'slug')->ignore($product?->id)],
            'sku' => [$required, 'string', 'max:64', Rule::unique('products', 'sku')->ignore($product?->id)],
            'description' => ['nullable', 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'compare_price' => ['nullable', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0'],
            'is_engravable' => ['sometimes', 'boolean'],
            'badge' => ['nullable', 'string', 'max:40'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'hidden'])],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],

            // New image uploads (multipart: images[]).
            'images' => ['sometimes', 'array', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],

            // Variants are synced: rows with an id are updated, rows without are created,
            // existing variants missing from the list are deleted. Omit "variants" to leave them alone.
            'variants' => ['sometimes', 'array'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.name' => ['required', 'string', 'max:100'],
            'variants.*.color_hex' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'variants.*.sku' => ['nullable', 'string', 'max:64', 'distinct'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'variants.*.is_active' => ['sometimes', 'boolean'],
        ];
    }
}
