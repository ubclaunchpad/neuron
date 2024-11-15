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

    insertProfilePicture(profilePic: any) : Promise<any> {
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
                resolve(results[0]);
            });
        });
    }

    updateProfilePicture(volunteer_id: string, profile_picture: string) {
        return new Promise((resolve, reject) => {
            const query = "UPDATE volunteer_profile_pics SET profile_pic = ? WHERE fk_volunteer_id = ?";
            const values = [ 
                profile_picture,
                volunteer_id
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
}
