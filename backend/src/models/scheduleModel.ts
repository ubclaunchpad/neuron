import { ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { ScheduleDB, ShiftDB, VolunteerScheduleDB } from '../common/generated.js';
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

    async getActiveSchedulesForClass(classId: number): Promise<ScheduleDB[]> {
        const query = `
            SELECT 
                s.*,
                GROUP_CONCAT(vs.fk_volunteer_id) as volunteer_ids
            FROM schedule s 
            LEFT JOIN volunteer_schedule vs
            ON s.schedule_id = vs.fk_schedule_id
            WHERE fk_class_id = ?
            AND s.active = true
            GROUP BY s.schedule_id`;
        const values = [classId];

        const [results, _] = await connectionPool.query<ScheduleDB[]>(query, values);

        return results;
    }

    private async addSchedulesWithTransaction(classId: number, scheduleItems: ScheduleDB[], transaction: PoolConnection): Promise<any> {
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

    async addSchedulesToClass(classId: number, scheduleItems: ScheduleDB[], transaction?: PoolConnection): Promise<any> {
        if (transaction) {
            return await this.addSchedulesWithTransaction(classId, scheduleItems, transaction);
        }

        transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();
            const results = await this.addSchedulesWithTransaction(classId, scheduleItems, transaction);
            await transaction.commit();

            return results;
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }
  
    async deleteSchedulesFromClass(classId: number, scheduleIds: number[], transaction?: PoolConnection): Promise<any> {
        const connection = transaction ?? connectionPool;

        const query = `DELETE FROM schedule WHERE fk_class_id = ? AND schedule_id IN (?)`;
        const values = [classId, scheduleIds];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results;
    }

    private async assignVolunteersWithTransaction(classId: number, scheduleId: number, volunteerIds: any[], transaction: PoolConnection): Promise<any> {
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

    async assignVolunteersByScheduleId(classId: number, scheduleId: number, volunteerIds: any[], transaction?: PoolConnection): Promise<any> {
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

    private async unassignVolunteers(scheduleIds: number[], transaction: PoolConnection): Promise<void> {
        const query = `DELETE FROM volunteer_schedule WHERE fk_schedule_id IN (?)`;
        const values = [scheduleIds];
        await transaction.query<ResultSetHeader>(query, values);
    }

    private async setSchedulesInactive(scheduleIds: number[], transaction: PoolConnection): Promise<void> {
        const query = `UPDATE schedule SET active = false WHERE schedule_id IN (?)`;
        const values = [scheduleIds];
        await transaction.query<ResultSetHeader>(query, values);
    }

    async deleteOrSoftDeleteSchedules(classId: number, scheduleIds: number[], transaction?: PoolConnection): Promise<void> {
        if (transaction) {
            return await this.deleteOrSoftDeleteWithTransaction(classId, scheduleIds, transaction);
        }

        transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();

            const result = await this.deleteOrSoftDeleteWithTransaction(classId, scheduleIds, transaction);

            await transaction.commit();

            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async deleteOrSoftDeleteWithTransaction(classId: number, scheduleIds: number[], transaction: PoolConnection): Promise<any> {
        // unassign current volunteers from schedule
        await this.unassignVolunteers(scheduleIds, transaction);

        // delete all future shifts for this schedule
        await shiftModel.deleteFutureShifts(scheduleIds, transaction);

        const query = `
            SELECT DISTINCT fk_schedule_id
            FROM shifts
            WHERE fk_schedule_id IN (?)
        `
        const values = [scheduleIds];
        const [results, _] = await transaction.query<ShiftDB[]>(query, values);

        const schedulesToSetInactive = results.map((result) => result.fk_schedule_id);

        const query2 = `
            SELECT schedule_id
            FROM schedule
            WHERE schedule_id IN (?) 
            ${schedulesToSetInactive.length > 0 ? "AND schedule_id NOT IN (?)" : ""}
        `
        const values2 = [scheduleIds, schedulesToSetInactive];
        const [results2, _2] = await transaction.query<ScheduleDB[]>(query2, values2);

        const schedulesToDelete = results2.map((result) => result.schedule_id as number);

        // set these schedules as inactive
        if (schedulesToSetInactive.length > 0) {
            await this.setSchedulesInactive(schedulesToSetInactive, transaction);
        }

        // delete these schedules
        if (schedulesToDelete.length > 0) {
            await this.deleteSchedulesFromClass(classId, schedulesToDelete, transaction);
        }

        if (schedulesToDelete.length > 0 || schedulesToSetInactive.length > 0) {
            return {
                inactiveSchedules: schedulesToSetInactive,
                deletedSchedules: schedulesToDelete
            }
        } 
        throw new Error("No schedules found under the given ids.");
    }

    async getCurrentAssignments(scheduleIds: number[], transaction: PoolConnection): Promise<Map<number, string[]>> {
        const query = `SELECT * FROM volunteer_schedule WHERE fk_schedule_id IN (?)`;
        const values = [scheduleIds];
        const [results, _] = await transaction.query<VolunteerScheduleDB[]>(query, values);
        
        const assignments: Map<number, string[]> = new Map();
        results.forEach((result: VolunteerScheduleDB) => {
            const volunteerIds = assignments.get(result.fk_schedule_id) ?? [];
            volunteerIds.push(result.fk_volunteer_id);
            assignments.set(result.fk_schedule_id, volunteerIds); 
        });
        return assignments;
    }

    async updateScheduleById(classId: number, scheduleId: number, schedule: ScheduleDB): Promise<any> {
        const transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();

            if (!schedule.volunteer_ids) {
                // need to get the currently assigned volunteers
                const assignments = await this.getCurrentAssignments([scheduleId], transaction);

                schedule = { 
                    ...schedule, 
                    volunteer_ids: assignments.get(scheduleId) ?? []
                };
                console.log(schedule);
            }

            const deletionResults = await this.deleteOrSoftDeleteSchedules(classId, [scheduleId], transaction);
            
            // add new schedule with future shifts
            const additionResults = await this.addSchedulesToClass(classId, [schedule], transaction);
            
            await transaction.commit();

            return {
                deletionResults: deletionResults,
                additionResults: additionResults
            };
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

    async updateSchedulesForClass(classId: number, schedules: ScheduleDB[]): Promise<any> {
        const transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();

            // get volunteer ids for schedules without
            const schedulesWithoutReassignments = schedules.filter(schedule => schedule.volunteer_ids === undefined);
            if (schedulesWithoutReassignments.length > 0) {
                const scheduleIds = schedulesWithoutReassignments.map(schedule => schedule.schedule_id as number);

                // need to get the currently assigned volunteers
                const assignments = await this.getCurrentAssignments(scheduleIds, transaction);

                schedules.map((schedule) => {
                    return schedule.volunteer_ids ? 
                        schedule : { 
                            ...schedule, 
                            volunteer_ids: assignments.get(schedule.schedule_id as number) ?? []
                        }
                })
            }
            const scheduleIds = schedules.map(schedule => schedule.schedule_id as number);

            // if the schedule still exists (meaning that there are historic shifts), set the schedule to inactive
            const deletionResults = await this.deleteOrSoftDeleteSchedules(classId, scheduleIds, transaction);

            // assign new volunteers to each schedule with 'volunteer_ids'
            const additionResults = await this.addSchedulesToClass(classId, schedules, transaction);

            await transaction.commit();

            return {
                deletionResults: deletionResults,
                additionResults: additionResults
            };
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }

    private async assignVolunteers(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<void> {
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

    private async updateMultipleSchedules(schedules: ScheduleDB[], transaction: PoolConnection): Promise<void> {
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