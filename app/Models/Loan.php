<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'borrower_name',
    'borrower_identifier',
    'borrower_phone',
    'purpose',
    'loan_date',
    'return_due_date',
    'returned_at',
    'status',
    'notes',
])]
class Loan extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'loan_date' => 'datetime',
            'return_due_date' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<LoanItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(LoanItem::class);
    }
}
