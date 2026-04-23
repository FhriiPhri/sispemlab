<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('DROP PROCEDURE IF EXISTS process_return;');
        DB::unprepared('
            CREATE PROCEDURE process_return(
                IN p_loan_id BIGINT,
                IN p_processed_by_id BIGINT,
                IN p_return_datetime DATETIME,
                IN p_condition_note TEXT,
                IN p_damage_fine INT,
                IN p_late_fine INT
            )
            BEGIN
                DECLARE expected_dt DATETIME;
                DECLARE total_fine INT;
                DECLARE v_payment_status VARCHAR(10);

                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    RESIGNAL;
                END;

                START TRANSACTION;

                SELECT return_due_date INTO expected_dt FROM loans WHERE id = p_loan_id;

                -- Use passed late fine and damage fine
                SET total_fine = p_late_fine + p_damage_fine;

                IF total_fine > 0 THEN
                    SET v_payment_status = \'unpaid\';
                ELSE
                    SET v_payment_status = \'paid\';
                END IF;

                INSERT INTO returns (loan_id, processed_by_id, return_date, fine, damage_fine, condition_note, payment_status, created_at, updated_at)
                VALUES (p_loan_id, p_processed_by_id, DATE(p_return_datetime), p_late_fine, p_damage_fine, p_condition_note, v_payment_status, NOW(), NOW());

                UPDATE loans SET status = \'returned\', returned_at = p_return_datetime WHERE id = p_loan_id;

                UPDATE tools
                INNER JOIN loan_items ON tools.id = loan_items.tool_id
                SET tools.stock_available = tools.stock_available + loan_items.quantity
                WHERE loan_items.loan_id = p_loan_id;

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
        // Reverting back to previous procedure where calculate_fine is used
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

                SELECT return_due_date INTO expected_dt FROM loans WHERE id = p_loan_id;
                SET calculated_fine = calculate_fine(expected_dt, p_return_datetime);
                SET total_fine = calculated_fine + p_damage_fine;

                IF total_fine > 0 THEN
                    SET v_payment_status = \'unpaid\';
                ELSE
                    SET v_payment_status = \'paid\';
                END IF;

                INSERT INTO returns (loan_id, processed_by_id, return_date, fine, damage_fine, condition_note, payment_status, created_at, updated_at)
                VALUES (p_loan_id, p_processed_by_id, DATE(p_return_datetime), calculated_fine, p_damage_fine, p_condition_note, v_payment_status, NOW(), NOW());

                UPDATE loans SET status = \'returned\', returned_at = p_return_datetime WHERE id = p_loan_id;

                UPDATE tools
                INNER JOIN loan_items ON tools.id = loan_items.tool_id
                SET tools.stock_available = tools.stock_available + loan_items.quantity
                WHERE loan_items.loan_id = p_loan_id;

                INSERT INTO activity_logs (user_id, action, description, created_at, updated_at)
                VALUES (p_processed_by_id, \'Return Processed\',
                    CONCAT(\'Pengembalian #\', p_loan_id, \' - Batas: \', expected_dt, \' | Kembali: \', p_return_datetime, \' | Denda: Rp \', total_fine),
                    NOW(), NOW());

                COMMIT;
            END;
        ');
    }
};
