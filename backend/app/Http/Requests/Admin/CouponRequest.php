<?php

namespace App\Http\Requests\Admin;

use App\Models\Coupon;
use Illuminate\Validation\Rule;

class CouponRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeBooleans(['is_active']);
        $this->emptyToNull(['max_discount', 'max_uses', 'starts_at', 'ends_at', 'description']);

        if ($this->filled('code')) {
            $this->merge(['code' => strtoupper(trim($this->input('code')))]);
        }
    }

    public function rules(): array
    {
        /** @var Coupon|null $coupon */
        $coupon = $this->route('coupon');
        $required = $this->isUpdate() ? 'sometimes' : 'required';

        return [
            'code' => [$required, 'string', 'max:50', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($coupon?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => [$required, Rule::in([Coupon::TYPE_PERCENT, Coupon::TYPE_FIXED])],
            'value' => [
                $required, 'numeric', 'min:1',
                Rule::when(
                    fn () => ($this->input('type') ?? $coupon?->type) === Coupon::TYPE_PERCENT,
                    ['max:100'],
                ),
            ],
            'min_order' => ['sometimes', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
