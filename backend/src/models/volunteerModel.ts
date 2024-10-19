import connectionPool from "../config/database.js";

export default class VolunteerModel {

    getVolunteerById(volunteer_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM volunteers WHERE volunteer_id = ?";
            const values = [volunteer_id];
    
            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(`An error occurred while executing the query: ${error}`);
                }
                if (results.length == 0) {
                    return reject("No volunteer found under the given ID");
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
                    return reject(`An error occurred while executing the query: ${error}`);
                }
                resolve(results);
            });
        });
    }

    updateVolunteer(volunteer_id: string, volunteerData: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Construct the SET clause dynamically
            const setClause = Object.keys(volunteerData).map(key => `${key} = ?`).join(', ');
            const query = `UPDATE volunteers SET ${setClause} WHERE volunteer_id = ?`;
            const values = [...Object.values(volunteerData), volunteer_id];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(`An error occurred while executing the query: ${error}`);
                }
                resolve(results);
            });
        });
    }

    addVolunteer(volunteerData: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Check if volunteer_id already exists
            const checkQuery = `SELECT COUNT(*) AS count FROM volunteers WHERE volunteer_id = ?`;
            connectionPool.query(checkQuery, [volunteerData.volunteer_id], (checkError: any, checkResults: any) => {
                if (checkError) {
                    return reject(checkError);
                }

                if (checkResults[0].count > 0) {
                    return reject(new Error('Volunteer ID already exists'));
                }

                // If volunteer_id does not exist, proceed with the insertion
                const query = `
                    INSERT INTO volunteers (
                        volunteer_id,
                        l_name,
                        f_name,
                        total_hours,
                        class_preferences,
                        bio,
                        active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                const values = [
                    volunteerData.volunteer_id,
                    volunteerData.l_name,
                    volunteerData.f_name,
                    volunteerData.total_hours,
                    volunteerData.class_preferences,
                    volunteerData.bio,
                    volunteerData.active
                ];

                connectionPool.query(query, values, (error: any, results: any) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(results);
                });
            });
        });
    }

    getVolunteerWithUserEmail(volunteer_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    users.email,
                    volunteers.volunteer_id,
                    volunteers.l_name,
                    volunteers.f_name,
                    volunteers.total_hours,
                    volunteers.class_preferences,
                    volunteers.bio,
                    volunteers.active
                FROM 
                    volunteers
                JOIN 
                    users ON volunteers.user_id = users.user_id
                WHERE 
                    volunteers.volunteer_id = ?;
            `;
            connectionPool.query(query, [volunteer_id], (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results[0]); // Assuming volunteer_id is unique
            });
        });
    }
}