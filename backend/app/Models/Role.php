<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    public const SUPER_ADMIN = 'super-admin';

    /**
     * Admin panel modules (key => label), mirrors the permissions matrix in the React admin.
     */
    public const MODULES = [
        'dashboard' => 'Dashboard',
        'orders' => 'Orders',
        'returns' => 'Returns',
        'shipments' => 'Shipments',
        'products' => 'Products',
        'categories' => 'Categories',
        'inventory' => 'Inventory',
        'customers' => 'Customers',
        'reviews' => 'Reviews',
        'coupons' => 'Coupons',
        'content' => 'Content & Banners',
        'payments' => 'Payments & COD',
        'reports' => 'Reports',
        'staff' => 'Staff & Roles',
        'settings' => 'Settings',
    ];

    public const ACTIONS = ['view', 'create', 'edit', 'delete'];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'permissions',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'is_system' => 'boolean',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->slug === self::SUPER_ADMIN;
    }

    public function allows(string $module, string $action = 'view'): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $actions = $this->permissions[$module] ?? [];

        return in_array('*', $actions, true) || in_array($action, $actions, true);
    }

    /**
     * Build a full permission matrix (every module => every action).
     *
     * @return array<string, array<int, string>>
     */
    public static function fullMatrix(): array
    {
        return array_fill_keys(array_keys(self::MODULES), self::ACTIONS);
    }
}
