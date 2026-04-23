<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value')->nullable();
            $table->string('type')->default('string'); // string, integer, float, boolean
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Insert default fine settings
        DB::table('settings')->insert([
            [
                'key' => 'fine_late_percentage_per_hour',
                'value' => '1',
                'type' => 'float',
                'description' => 'Persentase denda telat per jam dari harga alat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'fine_damage_percentage',
                'value' => '50',
                'type' => 'float',
                'description' => 'Persentase denda kerusakan dari harga alat',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'fine_lost_percentage',
                'value' => '100',
                'type' => 'float',
                'description' => 'Persentase denda kehilangan dari harga alat',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
