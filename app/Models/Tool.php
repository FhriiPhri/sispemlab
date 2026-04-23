<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'category_id',
    'code',
    'name',
    'image',
    'brand',
    'serial_number',
    'condition_status',
    'location',
    'stock_total',
    'stock_available',
    'description',
    'price',
])]
class Tool extends Model
{
    /**
     * Boot logic untuk template Auto Generate `code`.
     */
    protected static function booted(): void
    {
        static::creating(function (Tool $tool) {
            if (empty($tool->code)) {
                $latestId = static::max('id') ?? 0;
                $tool->code = 'ALAT-' . date('y') . '-' . str_pad($latestId + 1, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return HasMany<LoanItem, $this>
     */
    public function loanItems(): HasMany
    {
        return $this->hasMany(LoanItem::class);
    }
}
