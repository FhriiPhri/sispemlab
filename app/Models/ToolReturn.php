<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['loan_id', 'processed_by_id', 'return_date', 'fine', 'damage_fine', 'condition_note', 'payment_status'])]
class ToolReturn extends Model
{
    protected $table = 'returns';

    /**
     * Relasi ke Loan
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Relasi ke Petugas yang memproses
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_id');
    }

    /**
     * Total denda = denda keterlambatan + denda kerusakan
     */
    public function getTotalFineAttribute(): int
    {
        return ($this->fine ?? 0) + ($this->damage_fine ?? 0);
    }

    /**
     * Cek apakah ada denda yang belum lunas
     */
    public function hasPendingFine(): bool
    {
        return $this->total_fine > 0 && $this->payment_status === 'unpaid';
    }
}
