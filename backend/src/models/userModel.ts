import { ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import sharp from "sharp";
import { UserDB } from "../common/databaseModels.js";
import connectionPool from "../config/database.js";
import { imageModel } from "../config/models.js";
import { wrapIfNotArray } from "../utils/generalUtils.js";

export default class UserModel {
    async getUsersByIds(user_ids: string | string[], password: boolean = false): Promise<UserDB[]> {
        try {
            const query = `
                SELECT 
                    ${password ? "*" : "user_id, f_name, l_name, fk_image_id, email, role, created_at"}
                FROM users
                WHERE user_id IN (?)`;
            const values = [wrapIfNotArray(user_ids)];

            const [results, _] = await connectionPool.query<UserDB[]>(query, values);
            
            return results;
        } catch (e) {
            console.log(`user_ids: ${user_ids}`);
            console.trace();
            throw e;
        }
    }

    async getUserByEmail(email: string, password: boolean = false): Promise<UserDB> {
        const query = `
        SELECT 
            ${password ? "*" : "user_id, f_name, l_name, fk_image_id email, role, created_at"}
        FROM users
        WHERE email = ?`;
        const values = [email];

        const [results, _] = await connectionPool.query<UserDB[]>(query, values);

        if (results.length === 0) {
            throw {
                status: 400,
                message: `No user found with the given email`,
            };
        }

        return results[0];
    }

    async insertUser(user: Partial<UserDB>, transaction?: PoolConnection): Promise<ResultSetHeader> {
        const connection = transaction ?? connectionPool;

        const query = `INSERT INTO users (user_id, f_name, l_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [user.user_id, user.f_name, user.l_name, user.email, user.password, user.role];

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

    async updateUser(user_id: string, userData: Partial<UserDB>, transaction?: PoolConnection): Promise<ResultSetHeader> {
        const connection = transaction ?? connectionPool;

        /* ONLY ALLOW UPDATE PASSWORD FROM UPDATE PASSWORD FUNCTION */
        if (userData.password) {
            throw {
                error: "Updating password in updateUser",
            };
        }

        const setClause = Object.keys(userData)
            .map((key) => `${key} = ?`)
            .join(", ");
        const query = `UPDATE users SET ${setClause} WHERE user_id = ?`;
        const values = [...Object.values(userData), user_id];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results
    }

    async deleteUser(user_id: string): Promise<void> {
        const transaction = await connectionPool.getConnection();

        try {
            await transaction.beginTransaction();

            const users = await this.getUsersByIds(user_id);

            if (users.length === 0) {
                return;
            }

            const user = users[0];

            // Delete profile photo before user
            if (user.fk_image_id) {
                await imageModel.deleteImage(user.fk_image_id, transaction);
            }

            const query = `DELETE FROM users WHERE user_id = ?`;
            const values = [user_id];

            await transaction.query<ResultSetHeader>(query, values);

            await transaction.commit();
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }

    async upsertUserProfileImage(user_id: string, image: Buffer): Promise<string> {
        const transaction = await connectionPool.getConnection();

        // Process image
        const processedImage = await sharp(image)
            .resize({ width: 300, fit: 'outside'})
            .rotate()
            .toFormat('webp')
            .webp({ quality: 80 })
            .toBuffer();

        try {
            await transaction.beginTransaction();
            
            const users = await this.getUsersByIds(user_id);

            if (users.length === 0) {
                throw {
                    status: 400,
                    message: 'No user found with the given user_id'
                }
            }
            const user = users[0];

            // Delete old if exists
            if (user.fk_image_id) {
                await imageModel.deleteImage(user.fk_image_id, transaction);
            }

            const imageId = await imageModel.uploadImage(processedImage, transaction);
            await this.updateUser(user_id, { fk_image_id: imageId } as UserDB, transaction);

            await transaction.commit();

            return imageId;
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
   }

   async updateUserPassword(user_id: string, password: string, transaction?: PoolConnection): Promise<ResultSetHeader> {
        const connection = transaction ?? connectionPool;

        const query = `UPDATE users SET password = ? WHERE user_id = ?`;
        const values = [password, user_id];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results
    }

    async getAllVolunteerUsers(): Promise<UserDB[]> {
        const query = `SELECT * FROM users WHERE role = 'volunteer'`;
        const [results, _] = await connectionPool.query<UserDB[]>(query);
        
        return results;
    }

    async getAllAdminUsers(): Promise<UserDB[]> {
        const query = `SELECT * FROM users WHERE role = 'admin'`;
        const [results, _] = await connectionPool.query<UserDB[]>(query);
        
        return results;
    }

    async getUserByVolunteerId(volunteer_id: string): Promise<UserDB> {
        const query = `SELECT u.* 
        FROM users u
        JOIN volunteers v ON u.user_id = v.fk_user_id
        WHERE v.volunteer_id = ?;`;

        const values = [volunteer_id];
        const [results, _] = await connectionPool.query<UserDB[]>(query, values);

        return results[0];
    }
}
