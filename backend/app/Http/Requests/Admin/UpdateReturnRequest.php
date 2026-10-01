<?php

namespace App\Http\Requests\Admin;

use App\Models\ReturnRequest;
use Illuminate\Validation\Rule;

class UpdateReturnRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(ReturnRequest::STATUSES)],
            'resolution' => ['sometimes', Rule::in(ReturnRequest::RESOLUTIONS)],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
            // Put the returned quantity back into stock when the parcel is received.
            'restock' => ['sometimes', 'boolean'],
        ];
    }
}
