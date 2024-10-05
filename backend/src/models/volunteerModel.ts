import connectionPool from "../config/database.js";

export default class VolunteerModel {

    getVolunteerById(volunteer_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM volunteers WHERE volunteer_id = ?";
            const values = [volunteer_id];
    
            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(error);
                }
                if (results.length == 0) {
                    return reject("No volunteer found under the given ID");
                }
                resolve(results[0]);
            });
        })
    }

    getVolunteers(): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM volunteers";
            connectionPool.query(query, [], (error: any, results: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            })
        })
    }

    updateVolunteer(volunteer_id: string, volunteerData: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Construct the SET clause dynamically
            const setClause = Object.keys(volunteerData).map(key => `${key} = ?`).join(', ');
            const query = `UPDATE volunteers SET ${setClause} WHERE volunteer_id = ?`;
            const values = [...Object.values(volunteerData), volunteer_id];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
    }
}