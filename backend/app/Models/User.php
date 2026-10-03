<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role_id',
        'is_active',
        'avatar',
        'last_login_at',
        'date_of_birth',
        'notify_order_sms',
        'marketing_sms',
        'marketing_email',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'phone_verified_at' => 'datetime',
            'date_of_birth' => 'date',
            'notify_order_sms' => 'boolean',
            'marketing_sms' => 'boolean',
            'marketing_email' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function wishlistProducts(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'wishlists')->withTimestamps();
    }

    public function returnRequests(): HasMany
    {
        return $this->hasMany(ReturnRequest::class);
    }

    /**
     * Staff members are users that have a role; customers have none.
     */
    public function isStaff(): bool
    {
        return $this->role_id !== null;
    }

    public function isSuperAdmin(): bool
    {
        return (bool) $this->role?->isSuperAdmin();
    }

    /**
     * Check the role's permission matrix, e.g. $user->hasPermission('orders', 'edit').
     */
    public function hasPermission(string $module, string $action = 'view'): bool
    {
        if (! $this->is_active || ! $this->role) {
            return false;
        }

        return $this->role->allows($module, $action);
    }

    public function scopeCustomers(Builder $query): Builder
    {
        return $query->whereNull('role_id');
    }

    public function scopeStaff(Builder $query): Builder
    {
        return $query->whereNotNull('role_id');
    }
}
