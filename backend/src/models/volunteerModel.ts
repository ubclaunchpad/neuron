import connectionPool from "../config/database.js";

export default class VolunteerModel {
    getVolunteerById(volunteer_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
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

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                if (results.length == 0) {
                    return reject({
                        status: 400,
                        message: `No volunteer found under the given ID`,
                    });
                }
                resolve(results[0]);
            });
        });
    }

    getVolunteerByUserId(user_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM volunteers WHERE fk_user_id = ?";
            const values = [user_id];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                if (results.length == 0) {
                    return reject({
                        status: 400,
                        message: `No volunteer found with the given user_id`,
                    });
                }
                resolve(results[0]);
            });
        });
    }

    getVolunteers(): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM volunteers";
            connectionPool.query(query, [], (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                resolve(results);
            });
        });
    }

    updateVolunteer(volunteer_id: string, volunteerData: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Construct the SET clause dynamically
            const setClause = Object.keys(volunteerData)
                .map((key) => `${key} = ?`)
                .join(", ");
            const query = `UPDATE volunteers SET ${setClause} WHERE volunteer_id = ?`;
            const values = [...Object.values(volunteerData), volunteer_id];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                resolve(results);
            });
        });
    }

    insertVolunteer(volunteer: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const query =
                "INSERT INTO volunteers (volunteer_id, fk_user_id, f_name, l_name, email) VALUES (?, ?, ?, ?, ?)";
            const values = [
                volunteer.volunteer_id,
                volunteer.fk_user_id,
                volunteer.f_name,
                volunteer.l_name,
                volunteer.email,
                volunteer.active,
            ];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                resolve(results);
            });
        });
    }

    deleteVolunteer(user_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "DELETE FROM volunteers WHERE user_id = ?";
            const values = [user_id];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                resolve(results);
            });
        });
    }
}
