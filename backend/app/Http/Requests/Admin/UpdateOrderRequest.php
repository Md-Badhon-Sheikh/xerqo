<?php

namespace App\Http\Requests\Admin;

use App\Models\Order;
use Illuminate\Validation\Rule;

/**
 * Admin order update. "status" goes through OrderStatusService (validated transitions + history).
 */
class UpdateOrderRequest extends AdminRequest
{
    protected function prepareForValidation(): void
    {
        $this->emptyToNull(['courier', 'tracking_code', 'note', 'transaction_id']);
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(Order::STATUSES)],
            'note' => ['nullable', 'string', 'max:500'],
            'payment_status' => ['sometimes', Rule::in(Order::PAYMENT_STATUSES)],
            'transaction_id' => ['nullable', 'string', 'max:100'],
            'courier' => ['nullable', 'string', 'max:50'],
            'tracking_code' => ['nullable', 'string', 'max:100'],
        ];
    }
}
