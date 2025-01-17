import { ResultSetHeader } from "mysql2";
import { User } from "../common/generated.js";
import connection from "../config/database.js";

export default class UserModel {
    async getUserById(user_id: string): Promise<User> {
        const query = `SELECT * FROM users WHERE user_id = ?`;
        const values = [user_id];

        const [results, _] = await connection.query<User[]>(query, values);

        if (results.length === 0) {
            throw {
                status: 400,
                message: `No user found with the given user_id`,
            };
        }

        return results[0];
    }

    async getUserByEmail(email: string): Promise<User> {
        const query = `SELECT * FROM users WHERE email = ?`;
        const values = [email];

        const [results, _] = await connection.query<User[]>(query, values);

        if (results.length === 0) {
            throw {
                status: 400,
                message: `No user found with the given email`,
            };
        }

        return results[0];
    }

    async insertUser(user: Partial<User>): Promise<ResultSetHeader> {
        const query = `INSERT INTO users (user_id, email, password, role) VALUES (?, ?, ?, ?)`;
        const values = [user.user_id, user.email, user.password, user.role];

        const [results, _] = await connection.query<ResultSetHeader>(query, values).catch(error => {
            if (error.code === "ER_DUP_ENTRY") {
                throw {
                    status: 400,
                    message: `An account with the given email already exists`,
                };
            }
            throw error;
        });

        return results;
    }

    async updateUser(user_id: string, userData: Partial<User>): Promise<ResultSetHeader> {
        const setClause = Object.keys(userData)
            .map((key) => `${key} = ?`)
            .join(", ");
        const query = `UPDATE users SET ${setClause} WHERE user_id = ?`;
        const values = [...Object.values(userData), user_id];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results
    }

    async deleteUser(user_id: string): Promise<any> {
        const query = `DELETE FROM users WHERE user_id = ?`;
        const values = [user_id];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results
    }
}
