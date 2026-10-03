<?php

namespace App\Http\Requests;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Checkout payload (signed-in customers only):
 * {
 *   "name": "Rahim Uddin", "phone": "01712345678", "email": null,
 *   "district": "Dhaka", "area": "Dhanmondi", "address_line": "House 12, Road 5",
 *   "billing_same": true,                       // or false + billing_name / billing_phone / billing_address
 *   "payment_method": "cod" | "bkash" | "rocket" | "nagad" | "bank",
 *   "transaction_id": "8N7A6B5C4D", "sender_number": "01712345678",   // required for bKash / Rocket / Nagad
 *   "coupon_code": "XERQO500", "note": "Call before delivery",
 *   "items": [{"product_id": 1, "variant_id": null, "qty": 1, "engraving_text": "M. HOSSAIN"}]
 * }
 * The delivery zone (and so the delivery charge) always follows the district.
 */
class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $district = trim((string) $this->input('district'));

        $this->merge([
            'phone' => Phone::normalize($this->input('phone')),
            'delivery_zone' => strcasecmp($district, 'Dhaka') === 0 ? Order::ZONE_INSIDE_DHAKA : Order::ZONE_OUTSIDE_DHAKA,
            'payment_method' => is_string($this->input('payment_method')) ? strtolower($this->input('payment_method')) : $this->input('payment_method'),
            'coupon_code' => $this->filled('coupon_code') ? strtoupper(trim((string) $this->input('coupon_code'))) : null,
            'transaction_id' => $this->filled('transaction_id') ? strtoupper(trim((string) $this->input('transaction_id'))) : null,
            'sender_number' => $this->filled('sender_number') ? Phone::normalize($this->input('sender_number')) : null,
            'billing_phone' => $this->filled('billing_phone') ? Phone::normalize($this->input('billing_phone')) : null,
            'billing_same' => $this->boolean('billing_same', true),
        ]);
    }

    /**
     * Payment methods switched on in Settings › Payments.
     *
     * @return array<int, string>
     */
    public static function enabledMethods(): array
    {
        $config = (array) Setting::getValue('payments', []);

        return array_values(array_filter(Order::PAYMENT_METHODS, fn ($m) => (bool) data_get($config, "{$m}.enabled", $m === 'cod')));
    }

    public function rules(): array
    {
        $wallet = in_array($this->input('payment_method'), Order::WALLET_METHODS, true);

        return [
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX],
            'email' => ['nullable', 'email', 'max:255'],
            'district' => ['required', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100'],
            'address_line' => ['required', 'string', 'max:500'],
            'delivery_zone' => ['required', Rule::in([Order::ZONE_INSIDE_DHAKA, Order::ZONE_OUTSIDE_DHAKA])],

            'billing_same' => ['boolean'],
            'billing_name' => ['exclude_if:billing_same,true', 'required', 'string', 'max:100'],
            'billing_phone' => ['exclude_if:billing_same,true', 'required', 'string', 'regex:'.Phone::REGEX],
            'billing_address' => ['exclude_if:billing_same,true', 'required', 'string', 'max:500'],

            'payment_method' => ['required', Rule::in(self::enabledMethods())],
            'transaction_id' => [
                $wallet ? 'required' : 'nullable', 'string', 'max:100',
                // the same wallet transaction can't pay for two orders
                function (string $attribute, mixed $value, \Closure $fail) {
                    if ($value && Payment::where('transaction_id', $value)->where('status', '!=', Payment::STATUS_REJECTED)->exists()) {
                        $fail('This transaction ID has already been used for another order.');
                    }
                },
            ],
            'sender_number' => [$wallet ? 'required' : 'nullable', 'string', 'regex:'.Phone::REGEX],
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
            'billing_phone.regex' => 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX).',
            'sender_number.regex' => 'Enter the wallet number you paid from (01XXXXXXXXX).',
            'sender_number.required' => 'Enter the wallet number you paid from.',
            'transaction_id.required' => 'Enter the transaction ID from your payment SMS.',
            'payment_method.in' => 'This payment method is not available right now.',
            'items.required' => 'Your cart is empty.',
        ];
    }
}
