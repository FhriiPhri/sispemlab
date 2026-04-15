<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['loan_id', 'processed_by_id', 'return_date', 'fine', 'condition_note'])]
class ToolReturn extends Model
{
    protected $table = 'returns';

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_id');
    }
}
