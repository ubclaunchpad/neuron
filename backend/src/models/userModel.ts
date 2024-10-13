import connectionPool from "../config/database.js";

export default class UserModel {
    getUserByEmail(email: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM users WHERE email = ?`;
            const values = [email];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(new Error(`Error logging in: ${error}`));
                }

                if (results.length === 0) {
                    return reject(new Error("Incorrect email: User not found"));
                }

                return resolve(results[0]);
            });
        });
    }

    insertUser(user: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO users (user_id, email, password, role) VALUES (?, ?, ?, ?)`;
            const values = [user.user_id, user.email, user.password, user.role];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(new Error(`Error creating user: ${error}`));
                }

                return resolve(results);
            });
        });
    }

    deleteUser(user_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM users WHERE user_id = ?`;
            const values = [user_id];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(new Error(`Error deleting user: ${error}`));
                }

                return resolve(results);
            });
        });
    }
}
