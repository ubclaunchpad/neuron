-- Procedure to get all shifts for a volunteer by month
DROP PROCEDURE IF EXISTS GetShiftsByVolunteerIdAndMonth;
DELIMITER $$

CREATE PROCEDURE GetShiftsByVolunteerIdAndMonth(
    IN volunteer_id VARCHAR(255),
    IN month INT,
    IN year INT
)
BEGIN
    -- First query for 'my-shifts'
    SELECT 
        shifts.shift_id AS shift_id,
        shifts.shift_date AS shift_date,
        schedule.day AS day,
        schedule.start_time AS start_time,
        schedule.end_time AS end_time,
        class.class_id AS _class_id,
        class.class_name AS class_name,
        class.instructions AS instructions,
        class.zoom_link AS zoom_link,
        shifts.duration AS duration,
        shifts.fk_volunteer_id AS volunteer_id,
        shifts.checked_in AS checked_in,
        'my-shifts' AS shift_type,
        NULL AS coverage_status, -- No coverage status for 'my-shifts'
        NULL AS request_id -- No request_id for 'my-shifts'
    FROM 
        shifts
    JOIN 
        schedule ON shifts.fk_schedule_id = schedule.schedule_id
    JOIN 
        class ON schedule.fk_class_id = class.class_id
    WHERE 
        shifts.fk_volunteer_id = volunteer_id 
        AND MONTH(shifts.shift_date) = month
        AND YEAR(shifts.shift_date) = year

    UNION ALL

    -- Second query for 'coverage' with coverage status and request_id
    SELECT 
        shifts.shift_id AS shift_id,
        shifts.shift_date AS shift_date,
        schedule.day AS day,
        schedule.start_time AS start_time,
        schedule.end_time AS end_time,
        class.class_id AS _class_id,
        class.class_name AS class_name,
        class.instructions AS instructions,
        class.zoom_link AS zoom_link,
        shifts.duration AS duration,
        shifts.fk_volunteer_id AS volunteer_id,
        shifts.checked_in AS checked_in,
        'coverage' AS shift_type,
        CASE 
            WHEN shift_coverage_request.covered_by IS NOT NULL THEN 'resolved'
            WHEN EXISTS (
                SELECT 1 
                FROM pending_shift_coverage 
                WHERE pending_shift_coverage.request_id = shift_coverage_request.request_id 
                AND pending_shift_coverage.pending_volunteer = volunteer_id
            ) THEN 'pending'
            ELSE 'open'
        END AS coverage_status, -- Coverage status indicator
        shift_coverage_request.request_id AS request_id -- Request ID for coverage
    FROM 
        shifts
    JOIN 
        schedule ON shifts.fk_schedule_id = schedule.schedule_id
    JOIN 
        class ON schedule.fk_class_id = class.class_id
    JOIN 
        shift_coverage_request 
            -- ON shifts.fk_schedule_id = shift_coverage_request.fk_schedule_id
            -- AND shifts.shift_date = shift_coverage_request.shift_date
            ON shifts.shift_id = shift_coverage_request.fk_shift_id -- CHANGED FOR UPDATED SHIFTS TABLE
    LEFT JOIN 
        pending_shift_coverage ON shift_coverage_request.request_id = pending_shift_coverage.request_id
    WHERE 
        MONTH(shifts.shift_date) = month 
        AND YEAR(shifts.shift_date) = year 
        AND shifts.fk_volunteer_id <> volunteer_id

    UNION ALL

    -- Third query for 'my-coverage-requests' with request_id
    SELECT 
        shifts.shift_id AS shift_id,
        shifts.shift_date AS shift_date,
        schedule.day AS day,
        schedule.start_time AS start_time,
        schedule.end_time AS end_time,
        class.class_id AS _class_id,
        class.class_name AS class_name,
        class.instructions AS instructions,
        class.zoom_link AS zoom_link,
        shifts.duration AS duration,
        shifts.fk_volunteer_id AS volunteer_id,
        shifts.checked_in AS checked_in,
        'my-coverage-requests' AS shift_type,
        CASE 
            WHEN shift_coverage_request.covered_by IS NOT NULL THEN 'resolved'
            ELSE 'open'
        END AS coverage_status, -- Coverage status indicator
        shift_coverage_request.request_id AS request_id -- Request ID for 'my-coverage-request'
    FROM 
        shifts
    JOIN 
        schedule ON shifts.fk_schedule_id = schedule.schedule_id
    JOIN 
        class ON schedule.fk_class_id = class.class_id
    JOIN 
        shift_coverage_request 
            -- ON shifts.fk_volunteer_id = shift_coverage_request.fk_volunteer_id
            -- AND shifts.fk_schedule_id = shift_coverage_request.fk_schedule_id
            -- AND shifts.shift_date = shift_coverage_request.shift_date
            ON shifts.shift_id = shift_coverage_request.fk_shift_id -- CHANGED FOR UPDATED SHIFTS TABLE
    WHERE 
        shifts.fk_volunteer_id = volunteer_id 
        AND MONTH(shifts.shift_date) = month 
        AND YEAR(shifts.shift_date) = year
    ORDER BY 
        shift_date ASC,
        start_time ASC;
END$$

DELIMITER ;