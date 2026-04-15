<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'action', 'description'])]
class ActivityLog extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper statis untuk menyisipkan histori aktifitas per pengguna.
     */
    public static function record(string $action, string $description): void
    {
        if (auth()->check()) {
            self::create([
                'user_id' => auth()->id(),
                'action' => $action,
                'description' => $description,
            ]);
        }
    }
}
