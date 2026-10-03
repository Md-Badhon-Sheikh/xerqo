<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use App\Support\Phone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

/**
 * php artisan xerqo:create-admin — the first Super Admin on a fresh (production) install.
 */
class CreateSuperAdmin extends Command
{
    protected $signature = 'xerqo:create-admin {--name=} {--email=} {--phone=} {--password=}';

    protected $description = 'Create (or promote) a Super Admin account';

    public function handle(): int
    {
        $role = Role::where('slug', Role::SUPER_ADMIN)->first();
        if (! $role) {
            $this->error('Roles are missing. Run: php artisan db:seed --class=ProductionSeeder --force');

            return self::FAILURE;
        }

        $data = [
            'name' => $this->option('name') ?: $this->ask('Full name'),
            'email' => strtolower((string) ($this->option('email') ?: $this->ask('Email (used to sign in)'))),
            'phone' => Phone::normalize((string) ($this->option('phone') ?: $this->ask('Mobile (01XXXXXXXXX, optional)', ''))) ?: null,
            'password' => $this->option('password') ?: $this->secret('Password (at least 8 characters)'),
        ];

        $existing = User::where('email', $data['email'])->first();
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'regex:'.Phone::REGEX, 'unique:users,phone'.($existing ? ','.$existing->id : '')],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $user = User::updateOrCreate(['email' => $data['email']], [
            'name' => $data['name'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
            'role_id' => $role->id,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->info(($existing ? 'Promoted' : 'Created')." Super Admin {$user->name} <{$user->email}>. Sign in at /admin/login.");

        return self::SUCCESS;
    }
}
