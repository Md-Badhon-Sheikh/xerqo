<?php

namespace App\Http\Requests\Admin;

class BannerRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeBooleans(['is_active']);
        $this->emptyToNull(['subtitle', 'link', 'starts_at', 'ends_at']);
    }

    public function rules(): array
    {
        $required = $this->isUpdate() ? 'sometimes' : 'required';

        return [
            'title' => [$required, 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            // Either upload a file (multipart) or send an existing path / URL as "image_url".
            'image' => [$this->isUpdate() ? 'sometimes' : 'required_without:image_url', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'image_url' => ['nullable', 'string', 'max:255'],
            'link' => ['nullable', 'string', 'max:255'],
            'position' => ['sometimes', 'string', 'max:50'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
