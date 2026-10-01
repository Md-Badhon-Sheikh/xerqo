<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Review payload (JSON or multipart when photos are attached):
 * order_number (or order_id), product_id, rating 1-5, title?, body?, photos[]?,
 * delivery_rating?, courier_rating?, packaging_rating?
 */
class StoreReviewRequest extends FormRequest
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
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:150'],
            'body' => ['nullable', 'string', 'max:3000'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'delivery_rating' => ['nullable', 'integer', 'between:1,5'],
            'courier_rating' => ['nullable', 'integer', 'between:1,5'],
            'packaging_rating' => ['nullable', 'integer', 'between:1,5'],
        ];
    }
}
