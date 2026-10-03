<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    public const CATEGORIES = [
        'materials' => 'Leather & materials',
        'packaging' => 'Packaging',
        'courier' => 'Courier & delivery',
        'marketing' => 'Marketing & ads',
        'salary' => 'Salaries & wages',
        'rent' => 'Rent & utilities',
        'software' => 'Website & software',
        'fees' => 'Bank & payment fees',
        'other' => 'Other',
    ];

    public const METHODS = ['cash', 'bkash', 'nagad', 'rocket', 'bank', 'card'];

    public const METHOD_LABELS = ['cash' => 'Cash', 'bkash' => 'bKash', 'nagad' => 'Nagad', 'rocket' => 'Rocket', 'bank' => 'Bank', 'card' => 'Card'];

    protected $fillable = ['spent_on', 'category', 'amount', 'method', 'description', 'reference', 'receipt', 'user_id'];

    protected function casts(): array
    {
        return ['spent_on' => 'date', 'amount' => 'float'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
