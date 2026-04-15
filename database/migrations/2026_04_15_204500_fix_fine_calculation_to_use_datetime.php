<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Perbaiki Stored Procedure dan Function kalkulasi denda:
     * - Gunakan DATETIME bukan DATE, supaya perbedaan JAM dihitung
     * - Jika dikembalikan melewati batas waktu (detik pertama pun), charger minimal 1 hari
     * - Gunakan CEIL(TIMESTAMPDIFF(MINUTE, due, actual) / 1440) untuk presisi menit
     */
    public function up(): void
    {
        // 1. Drop & recreate calculate_fine function dengan DATETIME
        DB::unprepared('DROP FUNCTION IF EXISTS calculate_fine;');
        DB::unprepared('
            CREATE FUNCTION calculate_fine(expected_dt DATETIME, actual_dt DATETIME)
            RETURNS INT
            DETERMINISTIC
            BEGIN
                DECLARE seconds_late BIGINT;
                DECLARE days_late INT;
                IF actual_dt <= expected_dt THEN
                    RETURN 0;
                END IF;
                -- Hitung detik keterlambatan, bulatkan ke atas ke hari
                SET seconds_late = TIMESTAMPDIFF(SECOND, expected_dt, actual_dt);
                SET days_late = CEIL(seconds_late / 86400);
                RETURN days_late * 5000;
            END;
        ');

        // 2. Drop & recreate process_return pakai DATETIME untuk p_return_datetime
        DB::unprepared('DROP PROCEDURE IF EXISTS process_return;');
        DB::unprepared('
            CREATE PROCEDURE process_return(
                IN p_loan_id BIGINT,
                IN p_processed_by_id BIGINT,
                IN p_return_datetime DATETIME,
                IN p_condition_note TEXT,
                IN p_damage_fine INT
            )
            BEGIN
                DECLARE expected_dt DATETIME;
                DECLARE calculated_fine INT;
                DECLARE total_fine INT;
                DECLARE v_payment_status VARCHAR(10);

                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    RESIGNAL;
                END;

                START TRANSACTION;

                -- Ambil batas waktu pengembalian (datetime)
                SELECT return_due_date INTO expected_dt FROM loans WHERE id = p_loan_id;

                -- Hitung denda keterlambatan (datetime-aware, CEIL ke hari)
                SET calculated_fine = calculate_fine(expected_dt, p_return_datetime);
                SET total_fine = calculated_fine + p_damage_fine;

                -- Auto-set status pembayaran
                IF total_fine > 0 THEN
                    SET v_payment_status = \'unpaid\';
                ELSE
                    SET v_payment_status = \'paid\';
                END IF;

                -- Insert catatan pengembalian
                INSERT INTO returns (loan_id, processed_by_id, return_date, fine, damage_fine, condition_note, payment_status, created_at, updated_at)
                VALUES (p_loan_id, p_processed_by_id, DATE(p_return_datetime), calculated_fine, p_damage_fine, p_condition_note, v_payment_status, NOW(), NOW());

                -- Update status loan
                UPDATE loans SET status = \'returned\', returned_at = p_return_datetime WHERE id = p_loan_id;

                -- Kembalikan stok alat
                UPDATE tools
                INNER JOIN loan_items ON tools.id = loan_items.tool_id
                SET tools.stock_available = tools.stock_available + loan_items.quantity
                WHERE loan_items.loan_id = p_loan_id;

                -- Log aktifitas
                INSERT INTO activity_logs (user_id, action, description, created_at, updated_at)
                VALUES (p_processed_by_id, \'Return Processed\',
                    CONCAT(\'Pengembalian #\', p_loan_id, \' - Batas: \', expected_dt, \' | Kembali: \', p_return_datetime, \' | Denda: Rp \', total_fine),
                    NOW(), NOW());

                COMMIT;
            END;
        ');
    }

    public function down(): void
    {
        // Kembalikan versi DATE-only
        DB::unprepared('DROP FUNCTION IF EXISTS calculate_fine;');
        DB::unprepared('
            CREATE FUNCTION calculate_fine(expected_date DATE, actual_date DATE)
            RETURNS INT
            DETERMINISTIC
            BEGIN
                DECLARE days_late INT;
                SET days_late = DATEDIFF(actual_date, expected_date);
                IF days_late > 0 THEN
                    RETURN days_late * 5000;
                ELSE
                    RETURN 0;
                END IF;
            END;
        ');

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
                SELECT return_due_date INTO expected_date FROM loans WHERE id = p_loan_id;
                SET calculated_fine = calculate_fine(DATE(expected_date), p_return_date);
                SET total_fine = calculated_fine + p_damage_fine;
                IF total_fine > 0 THEN
                    SET v_payment_status = \'unpaid\';
                ELSE
                    SET v_payment_status = \'paid\';
                END IF;
                INSERT INTO returns (loan_id, processed_by_id, return_date, fine, damage_fine, condition_note, payment_status, created_at, updated_at)
                VALUES (p_loan_id, p_processed_by_id, p_return_date, calculated_fine, p_damage_fine, p_condition_note, v_payment_status, NOW(), NOW());
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
