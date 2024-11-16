import connectionPool from "../config/database.js";

export default class UserModel {
    getUserById(user_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM users WHERE user_id = ?`;
            const values = [user_id];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }

                if (results.length === 0) {
                    return reject({
                        status: 400,
                        message: `No user found with the given user_id`,
                    });
                }

                return resolve(results[0]);
            });
        });
    }

    getUserByEmail(email: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM users WHERE email = ?`;
            const values = [email];

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }

                if (results.length === 0) {
                    return reject({
                        status: 400,
                        message: `No user found with the given email`,
                    });
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
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }

                return resolve(results);
            });
        });
    }

    updateUser(user_id: string, userData: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const setClause = Object.keys(userData)
                .map((key) => `${key} = ?`)
                .join(", ");
            const query = `UPDATE users SET ${setClause} WHERE user_id = ?`;
            const values = [...Object.values(userData), user_id];

            // console.log(query);

            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
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
                    return reject({
                        status: 500,
                        message: `An error occurred while executing the query: ${error}`,
                    });
                }

                return resolve(results);
            });
        });
    }
}
