import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { ShiftDB, VolunteerDB } from "../common/generated.js";
import connectionPool from "../config/database.js";

export default class VolunteerModel {
    async getVolunteerById(volunteer_id: string): Promise<VolunteerDB> {
        const query = `
            SELECT 
                v.*, u.created_at 
            FROM 
                volunteers v
            JOIN 
                users u ON v.fk_user_id = u.user_id
            WHERE 
                volunteer_id = ?
            `;
        const values = [volunteer_id];

        const [results, _] = await connectionPool.query<VolunteerDB[]>(query, values);

        if (results.length === 0) {
            throw {
                status: 400,
                message: `No volunteer found under the given ID`,
            };
        }

        return results[0];
    }

    async getVolunteerByUserId(user_id: string): Promise<VolunteerDB> {
        const query = "SELECT * FROM volunteers WHERE fk_user_id = ?";
        const values = [user_id];

        const [results, _] = await connectionPool.query<VolunteerDB[]>(query, values);

        if (results.length === 0) {
            throw {
                status: 400,
                message: `No volunteer found under the given ID`,
            };
        }

        return results[0];
    }

    async getVolunteers(): Promise<VolunteerDB[]> {
        const query = "SELECT * FROM volunteers";

        const [results, _] = await connectionPool.query<VolunteerDB[]>(query, []);

        return results;
    }

    async getUnverifiedVolunteers(): Promise<VolunteerDB[]> {
        const query = "SELECT * FROM volunteers WHERE active = false";

        const [results, _] = await connectionPool.query<VolunteerDB[]>(query, []);

        return results
    }

    async updateVolunteer(volunteer_id: string, volunteerData: Partial<VolunteerDB>): Promise<ResultSetHeader> {
        // Construct the SET clause dynamically
        const setClause = Object.keys(volunteerData)
            .map((key) => `${key} = ?`)
            .join(", ");
        const query = `UPDATE volunteers SET ${setClause} WHERE volunteer_id = ?`;
        const values = [...Object.values(volunteerData), volunteer_id];

        const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

        return results
    }

    async insertVolunteer(volunteer: VolunteerDB, transaction?: PoolConnection): Promise<any> {
        const connection = transaction ?? connectionPool;
        
        // Construct the INSERT clause dynamically
        const insertClause = Object.keys(volunteer)
            .join(", ");
        const valuesClause = Object.keys(volunteer)
            .map(_ => '?')
            .join(", ");
        const query = `INSERT INTO volunteers (${insertClause}) VALUES (${valuesClause})`;
        const values = Object.values(volunteer);

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results
    }

    async deleteVolunteer(user_id: string): Promise<any> {
        const query = "DELETE FROM volunteers WHERE user_id = ?";
        const values = [user_id];

        const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

        return results;
    }

    async shiftCheckIn(volunteer_id: string, fk_schedule_id: any, shift_date: any): Promise<void> {
        const query1 = `SELECT duration FROM shifts WHERE fk_volunteer_id = ? AND fk_schedule_id = ? AND shift_date = ?`;
        const values1 = [volunteer_id, fk_schedule_id, shift_date];
            
        const [results] = await connectionPool.query<ShiftDB[]>(query1, values1);

        if (results.length === 0) {
            throw {
                status: 400,
                message: `No shift found for the given volunteer and schedule.`,
            };
        }
        const duration = results[0].duration;

        // Get the volunteer's current hours
        const query2 = "SELECT total_hours FROM volunteers WHERE volunteer_id = ?";
        const values2 = [volunteer_id];

        const [results2] = await connectionPool.query<VolunteerDB[]>(query2, values2);

        if (results2.length == 0) {
            throw {
                status: 400,
                message: `No volunteer found under the given ID`,
            };
        }

        const hours_so_far = results2[0].total_hours;
        const new_total_hours = hours_so_far ?? 0 + duration;

        // Update volunteer hours and shift check-in in a single query
        const updateQuery = `
            UPDATE volunteers v
            JOIN shifts s ON s.fk_volunteer_id = v.volunteer_id
            SET 
                v.total_hours = ?,
                s.checked_in = 1
            WHERE 
                v.volunteer_id = ? AND
                s.fk_schedule_id = ? AND
                s.shift_date = ?
        `;
        const updateValues = [new_total_hours, volunteer_id, fk_schedule_id, shift_date];

        const [updateResults] = await connectionPool.query<ResultSetHeader>(updateQuery, updateValues);

        if (updateResults.affectedRows === 0) {
            throw {
                status: 400,
                message: `No rows updated. Verify all parameters.`,
            };
        }
    }

    async getPreferredClassesById(volunteer_id: string): Promise<any> {

        const query = `
            WITH 
                class_info AS (
                    SELECT 
                        c.class_id,
                        c.class_name,
                        c.instructions
                    FROM class c
                ),
                schedule_info AS (
                    SELECT 
                        s.fk_class_id AS class_id,
                        GROUP_CONCAT(s.start_time ORDER BY s.start_time) AS start_times,
                        GROUP_CONCAT(s.end_time ORDER BY s.start_time) AS end_times,
                        GROUP_CONCAT(s.day ORDER BY s.start_time) AS days_of_week
                    FROM schedule s
                    GROUP BY s.fk_class_id
                )

            SELECT 
                ci.class_id,
                ci.class_name,
                cp.class_rank,
                COALESCE(si.start_times, NULL) AS start_times,
                COALESCE(si.end_times, NULL) AS end_times,
                COALESCE(si.days_of_week, NULL) AS day_of_week,
                ci.instructions
            FROM volunteers v
            JOIN class_preferences cp ON v.volunteer_id = cp.fk_volunteer_id
            JOIN class_info ci ON ci.class_id = cp.fk_class_id
            LEFT JOIN schedule_info si ON ci.class_id = si.class_id
            WHERE v.volunteer_id = ?;
        `;
        const values = [volunteer_id];

        const [results, _] = await connectionPool.query<any>(query, values);

        return results;
    }
}
