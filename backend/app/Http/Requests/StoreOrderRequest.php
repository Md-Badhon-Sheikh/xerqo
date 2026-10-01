<?php

namespace App\Http\Requests;

use App\Models\Order;
use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Checkout payload (guest or logged-in):
 * {
 *   "name": "Rahim Uddin", "phone": "01712345678", "email": null,
 *   "district": "Dhaka", "area": "Dhanmondi", "address_line": "House 12, Road 5",
 *   "delivery_zone": "inside_dhaka" | "outside_dhaka" (also accepts "inside" / "outside"),
 *   "payment_method": "cod" | "bkash" | "nagad" | "card",
 *   "coupon_code": "XERQO500", "note": "Call before delivery",
 *   "items": [{"product_id": 1, "variant_id": null, "qty": 1, "engraving_text": "M. HOSSAIN"}]
 * }
 */
class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $zone = $this->input('delivery_zone');
        $zone = match ($zone) {
            'inside', 'inside_dhaka', 'Inside Dhaka' => Order::ZONE_INSIDE_DHAKA,
            'outside', 'outside_dhaka', 'Outside Dhaka' => Order::ZONE_OUTSIDE_DHAKA,
            default => $zone,
        };

        // If no zone is sent, derive it from the district.
        if ($zone === null && $this->filled('district')) {
            $zone = strcasecmp(trim((string) $this->input('district')), 'Dhaka') === 0
                ? Order::ZONE_INSIDE_DHAKA
                : Order::ZONE_OUTSIDE_DHAKA;
        }

        $this->merge([
            'phone' => Phone::normalize($this->input('phone')),
            'delivery_zone' => $zone,
            'payment_method' => is_string($this->input('payment_method')) ? strtolower($this->input('payment_method')) : $this->input('payment_method'),
            'coupon_code' => $this->filled('coupon_code') ? strtoupper(trim((string) $this->input('coupon_code'))) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX],
            'email' => ['nullable', 'email', 'max:255'],
            'district' => ['required', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100'],
            'address_line' => ['required', 'string', 'max:500'],
            'delivery_zone' => ['required', Rule::in([Order::ZONE_INSIDE_DHAKA, Order::ZONE_OUTSIDE_DHAKA])],
            'payment_method' => ['required', Rule::in(Order::PAYMENT_METHODS)],
            'transaction_id' => ['nullable', 'string', 'max:100'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'note' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:20'],
            'items.*.engraving_text' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).',
            'items.required' => 'Your cart is empty.',
        ];
    }
}
