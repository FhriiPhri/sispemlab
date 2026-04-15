<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            // Denda kerusakan/hilang manual oleh petugas
            $table->integer('damage_fine')->default(0)->after('fine');
            // Status bayar denda (cukup jika fine+damage_fine > 0)
            $table->enum('payment_status', ['paid', 'unpaid'])->default('paid')->after('damage_fine');
        });

        // Update Stored Procedure `process_return` agar auto set payment_status
        DB::unprepared('DROP PROCEDURE IF EXISTS process_return;');
        DB::unprepared('
            CREATE PROCEDURE process_return(
                IN p_loan_id BIGINT,
                IN p_processed_by_id BIGINT,
                IN p_return_date DATE,
                IN p_condition_note TEXT,
                IN p_damage_fine INT
            )
            BEGIN
                DECLARE expected_date DATE;
                DECLARE calculated_fine INT;
                DECLARE total_fine INT;
                DECLARE v_payment_status VARCHAR(10);

                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    RESIGNAL;
                END;

                START TRANSACTION;

                -- Get expected return date
                SELECT return_due_date INTO expected_date FROM loans WHERE id = p_loan_id;

                -- Calculate late fine using existing function
                SET calculated_fine = calculate_fine(DATE(expected_date), p_return_date);
                SET total_fine = calculated_fine + p_damage_fine;

                -- Auto set payment status
                IF total_fine > 0 THEN
                    SET v_payment_status = \'unpaid\';
                ELSE
                    SET v_payment_status = \'paid\';
                END IF;

                -- Insert into returns table
                INSERT INTO returns (loan_id, processed_by_id, return_date, fine, damage_fine, condition_note, payment_status, created_at, updated_at)
                VALUES (p_loan_id, p_processed_by_id, p_return_date, calculated_fine, p_damage_fine, p_condition_note, v_payment_status, NOW(), NOW());

                -- Update loan status
                UPDATE loans SET status = \'returned\', returned_at = NOW() WHERE id = p_loan_id;

                -- Restore stock: kembalikan stok alat
                UPDATE tools
                INNER JOIN loan_items ON tools.id = loan_items.tool_id
                SET tools.stock_available = tools.stock_available + loan_items.quantity
                WHERE loan_items.loan_id = p_loan_id;

                -- Log activity
                INSERT INTO activity_logs (user_id, action, description, created_at, updated_at)
                VALUES (p_processed_by_id, \'Return Processed\',
                    CONCAT(\'Pengembalian peminjaman #\', p_loan_id, \' diproses. Denda total: Rp \', total_fine),
                    NOW(), NOW());

                COMMIT;
            END;
        ');
    }

    public function down(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->dropColumn(['damage_fine', 'payment_status']);
        });

        // Restore stored procedure ke versi lama (4 params)
        DB::unprepared('DROP PROCEDURE IF EXISTS process_return;');
        DB::unprepared('
            CREATE PROCEDURE process_return(
                IN p_loan_id BIGINT,
                IN p_processed_by_id BIGINT,
                IN p_return_date DATE,
                IN p_condition_note TEXT
            )
            BEGIN
                DECLARE expected_date DATE;
                DECLARE calculated_fine INT;

                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    RESIGNAL;
                END;

                START TRANSACTION;
                SELECT return_due_date INTO expected_date FROM loans WHERE id = p_loan_id;
                SET calculated_fine = calculate_fine(expected_date, p_return_date);
                INSERT INTO returns (loan_id, processed_by_id, return_date, fine, condition_note, created_at, updated_at)
                VALUES (p_loan_id, p_processed_by_id, p_return_date, calculated_fine, p_condition_note, NOW(), NOW());
                UPDATE loans SET status = \'returned\', returned_at = NOW() WHERE id = p_loan_id;
                UPDATE tools
                INNER JOIN loan_items ON tools.id = loan_items.tool_id
                SET tools.stock_available = tools.stock_available + loan_items.quantity
                WHERE loan_items.loan_id = p_loan_id;
                COMMIT;
            END;
        ');
    }
};
