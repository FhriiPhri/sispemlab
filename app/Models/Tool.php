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
])]
class Tool extends Model
{
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
