<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => Media::url($this->avatar),
            'is_active' => $this->is_active,
            'is_staff' => $this->isStaff(),
            'is_super_admin' => $this->isSuperAdmin(),
            'role' => $this->whenLoaded('role', fn () => $this->role ? new RoleResource($this->role) : null),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            // Admin customer list aggregates (withCount / withSum)
            'orders_count' => $this->whenCounted('orders'),
            'total_spent' => $this->when(
                array_key_exists('orders_sum_total', $this->getAttributes()),
                fn () => (float) $this->orders_sum_total,
            ),
        ];
    }
}
