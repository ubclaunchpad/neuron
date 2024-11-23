import { ProfilePic } from "../common/interfaces.js";
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
                `INSERT INTO volunteers (
                    volunteer_id, 
                    fk_user_id, 
                    f_name, 
                    l_name, 
                    p_name, 
                    total_hours, 
                    class_preferences, 
                    bio, 
                    active, 
                    email, 
                    pronouns, 
                    phone_number, 
                    city, 
                    province
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                volunteer.volunteer_id,
                volunteer.fk_user_id,
                volunteer.f_name,
                volunteer.l_name,
                volunteer.p_name,
                volunteer.total_hours,
                volunteer.class_preferences,
                volunteer.bio,
                volunteer.active,
                volunteer.email,
                volunteer.pronouns,
                volunteer.phone_number,
                volunteer.city,
                volunteer.province
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

    insertProfilePicture(profilePic: ProfilePic) : Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "INSERT INTO volunteer_profile_pics (fk_volunteer_id, profile_pic) VALUES (?, ?)";
            const values = [
                profilePic.volunteer_id, 
                profilePic.profile_picture
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

    getProfilePicture(volunteer_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT profile_pic FROM volunteer_profile_pics WHERE fk_volunteer_id = ?";
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
                        message: `No profile picture found under the given volunteer ID`,
                    });
                }
                resolve(results[0].profile_pic);
            });
        });
    }

    updateProfilePicture(profilePic: ProfilePic): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "UPDATE volunteer_profile_pics SET profile_pic = ? WHERE fk_volunteer_id = ?";
            const values = [ 
                profilePic.profile_picture,
                profilePic.volunteer_id
            ];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                if (results.affectedRows === 0) {
                    return reject({
                        status: 400,
                        message: `No profile picture found under the given volunteer ID.`,
                    });
                }
                resolve(results);
            });
        });
    }

    deleteProfilePicture(volunteer_id: string) {
        return new Promise((resolve, reject) => {
            const query = "DELETE FROM volunteer_profile_pics WHERE fk_volunteer_id = ?";
            const values = [volunteer_id];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                if (results.affectedRows === 0) {
                    return reject({
                        status: 400,
                        message: `No profile picture found under the given volunteer ID.`,
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
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }
                if (results.length === 0) {
                    return reject({
                        status: 400,
                        message: `No shift found for the given volunteer and schedule.`,
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
                            message: `An error occurred while executing the query: ${error}`,
                        });
                    }
                    if (results.length == 0) {
                        return reject({
                            status: 400,
                            message: `No volunteer found under the given ID`,
                        });
                    }

                    const hours_so_far = results[0].total_hours;

                    // Add the hours
                    const new_total_hours = hours_so_far + duration;

                    // Update the volunteer's hours
                    const volunteerData = {total_hours: new_total_hours};
                    this.updateVolunteer(volunteer_id, volunteerData);

                    resolve({
                        status: 200,
                        message: 'Volunteer hours updated successfully.',
                    });
                });
            });
        });
    }
}
