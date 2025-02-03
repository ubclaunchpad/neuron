import { ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { ScheduleDB } from '../common/generated.js';
import connectionPool from '../config/database.js';
import ShiftModel from '../models/shiftModel.js';

const shiftModel = new ShiftModel();

export default class ScheduleModel {
    async getAllSchedules(): Promise<ScheduleDB[]> {
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

    async getBundleFromClass(classId: number): Promise<ScheduleDB[]> {
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

    async addBundleWithTransaction(classId: number, scheduleItems: ScheduleDB[], transaction: PoolConnection): Promise<any> {
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

    async addBundle(classId: number, scheduleItems: ScheduleDB[], transaction?: PoolConnection): Promise<any> {
        if (transaction) {
            return await this.addBundleWithTransaction(classId, scheduleItems, transaction);
        }

        transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();
            const results = await this.addBundleWithTransaction(classId, scheduleItems, transaction);
            await transaction.commit();

            return results;
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }
  
    async deleteBundle(classId: number, scheduleIds: number[], transaction?: PoolConnection): Promise<any> {
        const connection = transaction ?? connectionPool;

        const query = `DELETE FROM schedule WHERE fk_class_id = ? AND schedule_id IN (?)`;
        const values = [classId, scheduleIds];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results;
    }

    async assignVolunteersWithTransaction(classId: number, scheduleId: number, volunteerIds: any[], transaction: PoolConnection): Promise<any> {
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

        return schedule;
    }

    async assignVolunteers(classId: number, scheduleId: number, volunteerIds: any[], transaction?: PoolConnection): Promise<any> {
        if (transaction) {
            return await this.assignVolunteersWithTransaction(classId, scheduleId, volunteerIds, transaction);
        }

        transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();

            const result = await this.assignVolunteersWithTransaction(classId, scheduleId, volunteerIds, transaction);

            await transaction.commit();

            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async unassignVolunteersFromBundle(scheduleIds: number[], transaction: PoolConnection): Promise<void> {
        const query = `DELETE FROM volunteer_schedule WHERE fk_schedule_id IN (?)`;
        const values = [scheduleIds];
        await transaction.query<ResultSetHeader>(query, values);
    }

    async updateSchedule(classId: number, scheduleId: number, schedule: ScheduleDB, volunteerIds: any[]): Promise<any> {
        const transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();

            // update schedule details if needed
            await this.updateScheduleDetails(schedule, scheduleId, transaction);

            if (volunteerIds) {
                // unassign current volunteers from schedule
                await this.unassignVolunteersFromBundle([scheduleId], transaction);

                // delete all future shifts for this schedule
                await shiftModel.deleteFutureShifts([scheduleId], transaction);

                // assign new volunteer(s)
                await this.assignVolunteers(classId, scheduleId, volunteerIds, transaction);
            }

            await transaction.commit();

            return {
                ...schedule,
                volunteerIds
            }
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }

    private async updateScheduleDetails(schedule: ScheduleDB, scheduleId: number, transaction: PoolConnection): Promise<void> {
        // Construct the SET clause dynamically
        const setClause = Object.keys(schedule)
            .map((key) => `${key} = ?`)
            .join(", ");
        const query = `UPDATE schedule SET ${setClause} WHERE schedule_id = ?`;
        const values = [...Object.values(schedule), scheduleId];

        if (setClause.length > 0) {
            await transaction.query<ResultSetHeader>(query, values);
        }
    }

    async updateBundle(classId: number, schedules: ScheduleDB[]): Promise<any> {
        const transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();

            await this.updateBundleDetails(schedules, transaction);

            // we only make reassignments for schedule objects with the 'volunteer_ids' field
            const filteredSchedules = schedules.filter(schedule => schedule.volunteer_ids !== undefined);
            const scheduleIds = filteredSchedules.map(schedule => schedule.schedule_id as number);

            if (scheduleIds.length > 0) {
                // unassign current volunteers from schedules
                await this.unassignVolunteersFromBundle(scheduleIds, transaction);

                // delete all future shifts for these schedules
                await shiftModel.deleteFutureShifts(scheduleIds, transaction);

                // assign new volunteers to each schedule with 'volunteer_ids'
                await this.assignVolunteersInBundle(classId, filteredSchedules, transaction);
            }

            await transaction.commit();

            return schedules;
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }

    private async assignVolunteersInBundle(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<void> {
        let valuesClause = "";
        const values: any[][] = [];
        schedules.forEach((schedule) => {
            schedule.volunteer_ids.forEach((volunteerId: any) => {
                valuesClause = valuesClause.concat("(?),");
                values.push([volunteerId, schedule.schedule_id]);
            })
        });
        valuesClause = valuesClause.slice(0, -1);

        // if there are any volunteer assignments
        if (valuesClause.length > 0) {
            // assign volunteers to schedule
            const query = `INSERT INTO volunteer_schedule (fk_volunteer_id, fk_schedule_id) VALUES ${valuesClause}`;
            await transaction.query<ResultSetHeader>(query, values);

            // create shifts for all schedules with assigned volunteers
            await shiftModel.addShiftsForSchedules(classId, schedules, transaction);
        }
    }

    private async updateBundleDetails(schedules: ScheduleDB[], transaction: PoolConnection): Promise<void> {
        if (schedules.length === 0) {
            return;
        }

        let dayCase = '';
        let startTimeCase = '';
        let endTimeCase = '';
        const scheduleIds: any[] = [];

        // build the CASE statements for each field and collect the schedule_ids
        schedules.forEach(schedule => {
            scheduleIds.push(schedule.schedule_id);
            dayCase += `WHEN schedule_id = ${schedule.schedule_id} THEN ${schedule.day} `;
            startTimeCase += `WHEN schedule_id = ${schedule.schedule_id} THEN '${schedule.start_time}' `;
            endTimeCase += `WHEN schedule_id = ${schedule.schedule_id} THEN '${schedule.end_time}' `;
        });

        const query = `
            UPDATE schedule 
            SET 
                day = CASE 
                    ${dayCase}
                    ELSE day END, 
                start_time = CASE
                    ${startTimeCase}
                    ELSE start_time END, 
                end_time = CASE
                    ${endTimeCase}
                    ELSE end_time END
            WHERE schedule_id IN (?)
        `;
        const values = [scheduleIds];
        await transaction.query<ResultSetHeader>(query, values);
    }
}