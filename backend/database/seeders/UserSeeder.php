<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $role = fn (string $slug) => Role::where('slug', $slug)->value('id');

        // Staff (password: "password", bcrypt-hashed)
        $staff = [
            ['name' => 'Dip Hossain', 'email' => 'dip@xerqo.com', 'phone' => '01700000001', 'role' => Role::SUPER_ADMIN, 'active' => true],
            ['name' => 'Mahmud Karim', 'email' => 'admin@xerqo.com', 'phone' => '01700000006', 'role' => Role::ADMIN, 'active' => true],
            ['name' => 'Rakib Hasan', 'email' => 'rakib@xerqo.com', 'phone' => '01700000002', 'role' => 'order-manager', 'active' => true],
            ['name' => 'Nasir Ahmed', 'email' => 'nasir@xerqo.com', 'phone' => '01700000003', 'role' => 'inventory', 'active' => true],
            ['name' => 'Sumaiya Khan', 'email' => 'sumaiya@xerqo.com', 'phone' => '01700000004', 'role' => 'support', 'active' => true],
            ['name' => 'Arif Chowdhury', 'email' => 'arif@xerqo.com', 'phone' => '01700000005', 'role' => 'content-editor', 'active' => false],
        ];

        foreach ($staff as $member) {
            User::updateOrCreate(['email' => $member['email']], [
                'name' => $member['name'],
                'phone' => $member['phone'],
                'password' => Hash::make('password'),
                'role_id' => $role($member['role']),
                'is_active' => $member['active'],
                'email_verified_at' => now(),
            ]);
        }

        // Customers (password: "password")
        $customers = [
            ['name' => 'Rahim Uddin', 'email' => 'rahim@example.com', 'phone' => '01712345678', 'district' => 'Dhaka', 'area' => 'Dhanmondi', 'line' => 'House 12, Road 5, Dhanmondi'],
            ['name' => 'Nusrat Jahan', 'email' => 'nusrat@example.com', 'phone' => '01815345678', 'district' => 'Chattogram', 'area' => 'Panchlaish', 'line' => 'Flat 4B, 22 CDA Avenue'],
            ['name' => 'Tanvir Ahmed', 'email' => 'tanvir@example.com', 'phone' => '01911345678', 'district' => 'Sylhet', 'area' => 'Zindabazar', 'line' => '45 Zindabazar Road'],
            ['name' => 'Farzana Akter', 'email' => 'farzana@example.com', 'phone' => '01556345678', 'district' => 'Dhaka', 'area' => 'Mirpur', 'line' => 'House 7, Road 3, Mirpur 10'],
            ['name' => 'Imran Hasan', 'email' => 'imran@example.com', 'phone' => '01688345678', 'district' => 'Khulna', 'area' => 'Sonadanga', 'line' => '18 KDA Avenue'],
            ['name' => 'Mitu Akter', 'email' => 'mitu@example.com', 'phone' => '01822345678', 'district' => 'Gazipur', 'area' => 'Tongi', 'line' => 'Station Road, Tongi'],
            ['name' => 'Rafiul Islam', 'email' => 'rafiul@example.com', 'phone' => '01733345678', 'district' => 'Sylhet', 'area' => 'Amberkhana', 'line' => '9 Amberkhana Lane'],
        ];

        foreach ($customers as $data) {
            $user = User::updateOrCreate(['email' => $data['email']], [
                'name' => $data['name'],
                'phone' => $data['phone'],
                'password' => Hash::make('password'),
                'role_id' => null,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            Address::updateOrCreate(
                ['user_id' => $user->id, 'label' => 'Home'],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'district' => $data['district'],
                    'area' => $data['area'],
                    'address_line' => $data['line'],
                    'is_default' => true,
                ],
            );
        }
    }
}
