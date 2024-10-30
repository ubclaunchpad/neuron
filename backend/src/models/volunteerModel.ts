import connectionPool from "../config/database.js";

export default class VolunteerModel {

    getVolunteerById(volunteer_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM volunteers WHERE volunteer_id = ?";
            const values = [volunteer_id];
    
            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        messages: `An error occurred while executing the query: ${error}`,
                    });
                }
                if (results.length == 0) {
                    return reject({
                        status: 400,
                        messages: `No volunteer found under the given ID`,
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
                        messages: `An error occurred while executing the query: ${error}`,
                    });
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
                    return reject({
                        status: 500,
                        messages: `An error occurred while executing the query: ${error}`,
                    });
                }
                resolve(results);
            });
        });
    }

    shiftCheckIn(volunteer_id: string, fk_schedule_id: any, shift_date: any): Promise<any> {
        return new Promise((resolve, reject) => {
            // Construct the SET clause dynamically
            // Get the shift duration

            const query1 = `SELECT duration FROM shifts WHERE fk_volunteer_id = ? AND fk_schedule_id = ? AND shift_date = ?`;
            const values1 = [volunteer_id, fk_schedule_id, shift_date];
            connectionPool.query(query1, values1, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        messages: `An error occurred while executing the query: ${error}`,
                    });
                }
                if (results.length === 0) {
                    return reject({
                        status: 400,
                        messages: `No shift found for the given volunteer and schedule.`,
                    });
                }

                const duration = results[0].duration;

                // Get the volunteer's hours so far
                const query = "SELECT * FROM volunteers WHERE volunteer_id = ?";
                const values2 = [volunteer_id];
        
                connectionPool.query(query, values2, (error: any, results: any) => {
                    if (error) {
                        return reject({
                            status: 500,
                            messages: `An error occurred while executing the query: ${error}`,
                        });
                    }
                    if (results.length == 0) {
                        return reject({
                            status: 400,
                            messages: `No volunteer found under the given ID`,
                        });
                    }

                    const hours_so_far = results[0].total_hours;

                    // Add the hours
                    const new_total_hours = hours_so_far + duration;

                    // Update the volunteer's hours
                    const volunteerData = {total_hours: new_total_hours};
                    this.updateVolunteer(volunteer_id, volunteerData);

                    resolve(results);
                });
            });
        });
        
    }
}