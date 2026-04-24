<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan kolom untuk integrasi Midtrans ke tabel returns.
 * - midtrans_order_id       : Order ID unik yang dikirim ke Midtrans
 * - midtrans_transaction_id : ID transaksi yang diterima dari Midtrans
 * - midtrans_payment_type   : Metode pembayaran (gopay, bank_transfer, dll)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->string('midtrans_order_id')->nullable()->after('payment_status');
            $table->string('midtrans_transaction_id')->nullable()->after('midtrans_order_id');
            $table->string('midtrans_payment_type')->nullable()->after('midtrans_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn(['midtrans_order_id', 'midtrans_transaction_id', 'midtrans_payment_type']);
        });
    }
};
