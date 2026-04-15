<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Function to calculate fine (e.g. 5000 / day late)
        DB::unprepared('
            DROP FUNCTION IF EXISTS calculate_fine;
            CREATE FUNCTION calculate_fine(expected_date DATE, actual_date DATE)
            RETURNS INT
            DETERMINISTIC
            BEGIN
                DECLARE days_late INT;
                DECLARE fine_amount INT;
                SET days_late = DATEDIFF(actual_date, expected_date);
                IF days_late > 0 THEN
                    SET fine_amount = days_late * 5000;
                ELSE
                    SET fine_amount = 0;
                END IF;
                RETURN fine_amount;
            END;
        ');

        // 2. Stored Procedure to process return with transactions
        DB::unprepared('
            DROP PROCEDURE IF EXISTS process_return;
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

                -- Get expected return date
                SELECT return_due_date INTO expected_date FROM loans WHERE id = p_loan_id;

                -- Calculate Fine using function
                SET calculated_fine = calculate_fine(expected_date, p_return_date);

                -- Insert into returns table
                INSERT INTO returns (loan_id, processed_by_id, return_date, fine, condition_note, created_at, updated_at)
                VALUES (p_loan_id, p_processed_by_id, p_return_date, calculated_fine, p_condition_note, NOW(), NOW());

                -- Update loan status
                UPDATE loans SET status = \'returned\', returned_at = NOW() WHERE id = p_loan_id;

                -- Restore stock logic: update tools stock
                -- Cursor or simple query to increment stock
                UPDATE tools 
                INNER JOIN loan_items ON tools.id = loan_items.tool_id
                SET tools.stock_available = tools.stock_available + loan_items.quantity
                WHERE loan_items.loan_id = p_loan_id;

                COMMIT;
            END;
        ');

        // 3. Trigger for activity log
        DB::unprepared('
            DROP TRIGGER IF EXISTS after_loan_insert;
            CREATE TRIGGER after_loan_insert
            AFTER INSERT ON loans
            FOR EACH ROW
            BEGIN
                INSERT INTO activity_logs (user_id, action, description, created_at, updated_at)
                VALUES (NEW.user_id, \'Loan Created\', CONCAT(\'User requested a loan for purpose: \', NEW.purpose), NOW(), NOW());
            END;
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS after_loan_insert');
        DB::unprepared('DROP PROCEDURE IF EXISTS process_return');
        DB::unprepared('DROP FUNCTION IF EXISTS calculate_fine');
    }
};
