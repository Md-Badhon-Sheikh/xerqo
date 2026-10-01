<?php

namespace App\Http\Resources;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Address */
class AddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'name' => $this->name,
            'phone' => $this->phone,
            'district' => $this->district,
            'area' => $this->area,
            'address_line' => $this->address_line,
            'is_default' => $this->is_default,
        ];
    }
}
