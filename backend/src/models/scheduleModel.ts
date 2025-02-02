import { ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { ScheduleDB } from '../common/generated.js';
import connectionPool from '../config/database.js';
import ShiftModel from '../models/shiftModel.js';

const shiftModel = new ShiftModel();

export default class ScheduleModel {
    async getSchedules(): Promise<ScheduleDB[]> {
        const query = `
            SELECT 
                s.*,
                GROUP_CONCAT(vs.fk_volunteer_id) as volunteer_ids
            FROM schedule s 
            LEFT JOIN volunteer_schedule vs
            ON s.schedule_id = vs.fk_schedule_id
            GROUP BY s.schedule_id`;

        const [results, _] = await connectionPool.query<ScheduleDB[]>(query, []);

        return results;
    }

    async getSchedulesByClassId(classId: number): Promise<ScheduleDB[]> {
        const query = `
            SELECT 
                s.*,
                GROUP_CONCAT(vs.fk_volunteer_id) as volunteer_ids
            FROM schedule s 
            LEFT JOIN volunteer_schedule vs
            ON s.schedule_id = vs.fk_schedule_id
            WHERE fk_class_id = ?
            GROUP BY s.schedule_id`;
        const values = [classId];

        const [results, _] = await connectionPool.query<ScheduleDB[]>(query, values);

        return results;
    }

    async setSchedulesWithTransaction(classId: number, scheduleItems: ScheduleDB[], transaction: PoolConnection) {
        const valuesClause1 = scheduleItems
            .map(() => '(?)')
            .join(", ");
        const query1 = `INSERT INTO schedule (fk_class_id, day, start_time, end_time) VALUES ${valuesClause1}`;
        const values1 = scheduleItems.map((schedule) => [
            classId,
            schedule.day,
            schedule.start_time,
            schedule.end_time,
        ]);
        
        const [results1, _] = await transaction.query<ResultSetHeader>(query1, values1);

        const ids: number[] = [];
        for (let id = results1.insertId; id < results1.insertId + results1.affectedRows; id++) {
            ids.push(id);
        }

        let valuesClause2 = "";
        scheduleItems.forEach((schedule) => {
            if (schedule.volunteer_ids) {
                schedule.volunteer_ids.forEach(() => valuesClause2 = valuesClause2.concat("(?),"));
            }
        })
        valuesClause2 = valuesClause2.slice(0, -1);

        // if there is at least one volunteer assigned to a schedule
        if (valuesClause2.length > 0) {
            const query2 = `INSERT INTO volunteer_schedule (fk_volunteer_id, fk_schedule_id) VALUES ${valuesClause2}`;
            const values2: any[][] = [];
            scheduleItems.forEach((schedule, index) => {
                if (schedule.volunteer_ids) {
                    schedule.volunteer_ids.forEach((volunteerId: string) => {
                        values2.push([volunteerId, ids[index]]);
                    })
                }
            })
            await transaction.query<ResultSetHeader>(query2, values2);
        }
        
        const createdSchedules = ids.map((schedule_id, index) => {
            const schedule = scheduleItems[index];
            return {
                schedule_id: schedule_id,
                fk_class_id: classId,
                day: schedule.day,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                volunteer_ids: schedule.volunteer_ids
            }
        });

        // if there are any assignments, create shifts for new schedules with assigned volunteers
        if (valuesClause2.length > 0) {
            await shiftModel.addShiftsForSchedules(classId, createdSchedules, transaction);
        }

        return createdSchedules;
    }

    async setSchedulesByClassId(classId: number, scheduleItems: ScheduleDB[], transaction?: PoolConnection): Promise<any> {
        if (transaction) {
            return await this.setSchedulesWithTransaction(classId, scheduleItems, transaction);
        }

        transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();
            const results = await this.setSchedulesWithTransaction(classId, scheduleItems, transaction);
            await transaction.commit();

            return results;
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }
  
    async deleteSchedulesByScheduleId(classId: number, scheduleIds: number[], transaction?: PoolConnection): Promise<any> {
        const connection = transaction ?? connectionPool;

        const query = `DELETE FROM schedule WHERE fk_class_id = ? AND schedule_id IN (?)`;
        const values = [classId, scheduleIds];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results;
    }

    async updateSchedulesByClassId(classId: number, newSchedules: ScheduleDB[]): Promise<void> {
        const transaction = await connectionPool.getConnection();

        try {
            await transaction.beginTransaction();

            // get existing schedules to delete
            const scheduleIdsToDelete: number[] = (await this.getSchedulesByClassId(classId))
                .map((schedule: ScheduleDB) => schedule.schedule_id as number);

            if (scheduleIdsToDelete.length > 0) {
                await this.deleteSchedulesByScheduleId(classId, scheduleIdsToDelete, transaction);
            }

            let results;
            if (newSchedules.length > 0) {
                results = await this.setSchedulesByClassId(classId, newSchedules, transaction);
            }
        
            await transaction.commit();
            return results;
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }

    async assignVolunteersToSchedule(classId: number, scheduleId: number, volunteerIds: any[]): Promise<any> {

        const transaction = await connectionPool.getConnection();

        try {
            await transaction.beginTransaction();

            let valuesClause = "";
            const values: any[][] = [];
            volunteerIds.forEach((volunteerId) => {
                valuesClause = valuesClause.concat("(?),");
                values.push([volunteerId, scheduleId]);
            });
            valuesClause = valuesClause.slice(0, -1);

            // assign volunteers to schedule
            const query = `INSERT INTO volunteer_schedule (fk_volunteer_id, fk_schedule_id) VALUES ${valuesClause}`;
            await transaction.query<ResultSetHeader>(query, values);

            // get schedule object
            const query2 = `
                SELECT 
                    schedule_id,
                    day,
                    TIME_FORMAT(start_time, '%H:%i') AS start_time,
                    TIME_FORMAT(end_time, '%H:%i') AS end_time
                FROM schedule 
                WHERE schedule_id = ?
            `;
            const values2 = [scheduleId];
            const [result, _] = await transaction.query<ScheduleDB[]>(query2, values2);

            const schedule = {
                volunteer_ids: volunteerIds,
                ...result[0]
            }

            // create shifts for all assigned volunteers
            await shiftModel.addShiftsForSchedules(classId, [schedule], transaction);

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
        
    }
}