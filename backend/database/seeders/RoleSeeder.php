<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $all = Role::ACTIONS; // view, create, edit, delete

        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => Role::SUPER_ADMIN,
                'description' => 'Full access to everything, including billing and ownership',
                'permissions' => Role::fullMatrix(),
            ],
            [
                'name' => 'Admin',
                'slug' => Role::ADMIN,
                'description' => 'Manages the whole store; SMS gateway, SMS balance and Super Admins stay with the Super Admin',
                'permissions' => Role::fullMatrix(),
            ],
            [
                'name' => 'Order Manager',
                'slug' => 'order-manager',
                'description' => 'Orders, returns, shipments, customers (view)',
                'permissions' => [
                    'dashboard' => ['view'],
                    'orders' => ['view', 'create', 'edit'],
                    'returns' => ['view', 'create', 'edit'],
                    'shipments' => ['view', 'create', 'edit'],
                    'customers' => ['view'],
                    'payments' => ['view'],
                    'products' => ['view'],
                ],
            ],
            [
                'name' => 'Inventory',
                'slug' => 'inventory',
                'description' => 'Products, categories, stock adjustments',
                'permissions' => [
                    'dashboard' => ['view'],
                    'products' => $all,
                    'categories' => $all,
                    'inventory' => ['view', 'create', 'edit'],
                    'reports' => ['view'],
                ],
            ],
            [
                'name' => 'Support',
                'slug' => 'support',
                'description' => 'Customers, reviews, returns',
                'permissions' => [
                    'dashboard' => ['view'],
                    'orders' => ['view'],
                    'customers' => ['view', 'edit'],
                    'reviews' => ['view', 'edit', 'delete'],
                    'returns' => ['view', 'create', 'edit'],
                ],
            ],
            [
                'name' => 'Content Editor',
                'slug' => 'content-editor',
                'description' => 'Banners, pages, blog, SEO',
                'permissions' => [
                    'dashboard' => ['view'],
                    'content' => $all,
                    'products' => ['view', 'edit'],
                    'categories' => ['view', 'edit'],
                    'reviews' => ['view'],
                ],
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], [...$role, 'is_system' => true]);
        }
    }
}
