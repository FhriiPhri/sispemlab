<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('borrower_name');
            $table->string('borrower_identifier')->nullable();
            $table->string('borrower_phone')->nullable();
            $table->string('purpose');
            $table->date('loan_date');
            $table->date('return_due_date');
            $table->timestamp('returned_at')->nullable();
            $table->enum('status', ['draft', 'pending', 'approved', 'borrowed', 'returned', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
