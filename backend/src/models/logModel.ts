import { DateTime } from "luxon";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { ClassDB, VolunteerDB } from "../common/databaseModels.js";
import { ListRequestOptions, ListResponse } from "../common/types.js";
import connectionPool from "../config/database.js";
import { classesModel, volunteerModel } from "../config/models.js";
import queryBuilder from "../config/queryBuilder.js";

export default class LogModel {
    async getLogsForList(listRequest: ListRequestOptions = {}): Promise<ListResponse<any>> {
        const page = listRequest.page ?? 0;
        const perPage = listRequest.perPage ?? 10;
        const offset = page * perPage;
        const search = listRequest.search;

        const logsQuery = queryBuilder({ l:'log' })
            .select('l.*')
            // COUNT(*) OVER () returns the total number of rows matching the query (ignoring limit/offset)
            .select(queryBuilder.raw('COUNT(*) OVER () as total_count'))
            .orderBy('l.created_at', 'desc')
            .limit(perPage)
            .offset(offset);

        // Apply search filters
        if (search) {
            logsQuery.where('l.page', 'like', `%${search}%`)
                .orWhere('l.description', 'like', `%${search}%`);
        }

        const { sql, bindings } = logsQuery.toSQL();
        const [logs] = await connectionPool.query<any[]>(sql, bindings);

        const volunteerIds = [...new Set(logs.map((log) => log.fk_volunteer_id).filter(Boolean))];
        const classIds = [...new Set(logs.map((log) => log.fk_class_id).filter(Boolean))];

        let volunteerMap: Record<string, VolunteerDB> = {};
        if (volunteerIds.length) {
            const volunteers = await volunteerModel.getVolunteersByIds(volunteerIds);

            volunteerMap = volunteers.reduce((map, volunteer) => {
                map[volunteer.volunteer_id] = volunteer;
                return map;
            }, {} as Record<string, VolunteerDB>);
        }

        let classMap: Record<string, ClassDB> = {};
        if (classIds.length) {
            const classes = await classesModel.getClassesByIds(classIds);

            classMap = classes.reduce((map, _class) => {
                map[_class.class_id] = _class;
                return map;
            }, {} as Record<string, ClassDB>);
        }

        // Grab total count
        const totalCount = logs.length > 0 ? logs[0].total_count : 0;

        // Transform logs
        logs.forEach((log) => {
            delete log.total_count;

            // Get full time string in ISO
            log.created_at = DateTime.fromFormat(
                log.created_at, 
                "yyyy-MM-dd HH:mm:ss", 
                { zone: 'utc' }
            ).toISO();

            if (log.fk_volunteer_id) {
                const volunteer = volunteerMap[log.fk_volunteer_id];
                log.volunteer_f_name = volunteer.f_name;
                log.volunteer_l_name = volunteer.l_name;
            }

            if (log.fk_class_id) {
                const _class = classMap[log.fk_class_id];
                log.class_name = _class.name;
            }
        });

        return { data: logs, totalCount };
    }
    
    async log(params: {
        signoff: string,
        page: string, 
        description: string, 
        volunteer_id?: string,
        class_id?: number,
        transaction?: PoolConnection
    }): Promise<any> {
        const { signoff, page, description, volunteer_id, class_id, transaction } = params;
        const connection = transaction ?? connectionPool;

        const log = {
            signoff, page, description, fk_volunteer_id: volunteer_id, fk_class_id: class_id
        };
        
        // Construct the INSERT clause dynamically
        const insertClause = Object.keys(log)
            .join(", ");
        const valuesClause = Object.keys(log)
            .map(_ => '?')
            .join(", ");
        const query = `INSERT INTO log (${insertClause}) VALUES (${valuesClause})`;
        const values = Object.values(log);

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results
    }
}