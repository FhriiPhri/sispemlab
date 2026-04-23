<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
     * Boot logic untuk template Auto Generate Invoice `loan_code`.
     */
    protected static function booted(): void
    {
        static::creating(function (Loan $loan) {
            if (empty($loan->loan_code)) {
                $datePrefix = date('Ymd');
                
                // Cari kode terakhir yang diawali dengan prefix hari ini
                $lastLoan = static::where('loan_code', 'like', "TRX-{$datePrefix}-%")
                    ->latest('id')
                    ->first();

                if ($lastLoan) {
                    // Ambil 4 digit terakhir dan tambah 1
                    $lastNumber = (int) substr($lastLoan->loan_code, -4);
                    $newNumber = $lastNumber + 1;
                } else {
                    $newNumber = 1;
                }

                $loan->loan_code = 'TRX-' . $datePrefix . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
            }
        });
    }

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

    /**
     * @return HasOne<ToolReturn, $this>
     */
    public function toolReturn(): HasOne
    {
        return $this->hasOne(ToolReturn::class);
    }
}
