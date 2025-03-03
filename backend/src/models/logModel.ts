import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { LogDB } from "../common/databaseModels.js";
import connectionPool from "../config/database.js";

export default class LogModel {
    async getAllSchedules(): Promise<LogDB[]> {
        const query = `
            SELECT 
                l.*, 
                c.class_name,
                CASE 
                    WHEN v.p_name IS NOT NULL THEN v.p_name
                    ELSE u.f_name
                END AS volunteer_name,
            FROM log l
            INNER JOIN 
                class c ON l.fk_class_id = c.class_id
            INNER JOIN 
                volunteers v ON l.fk_volunteer_id = v.volunteer_id
            INNER JOIN 
                users u ON v.fk_user_id = u.user_id`;

        const [results, _] = await connectionPool.query<LogDB[]>(query, []);

        return results;
    }
    
    async log(
        signoff: string, 
        description: string, 
        volunteer_id?: string,
        class_id?: number,
        transaction?: PoolConnection
    ): Promise<any> {
        const connection = transaction ?? connectionPool;

        const log = {
            signoff, description, fk_volunteer_id: volunteer_id, fk_class_id: class_id
        };
        
        // Construct the INSERT clause dynamically
        const insertClause = Object.keys(log)
            .join(", ");
        const valuesClause = Object.keys(log)
            .map(_ => '?')
            .join(", ");
        const query = `INSERT INTO volunteers (${insertClause}) VALUES (${valuesClause})`;
        const values = Object.values(log);

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results
    }
}