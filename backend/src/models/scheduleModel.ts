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

        const scheduleIds: number[] = [];
        for (let scheduleId = results1.insertId; scheduleId < results1.insertId + results1.affectedRows; scheduleId++) {
            scheduleIds.push(scheduleId);
        }
        
        const createdSchedules = scheduleIds.map((schedule_id, index) => {
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

        this.assignVolunteers(classId, createdSchedules, transaction);

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

    private async setSchedulesInactive(scheduleIds: number[], transaction: PoolConnection): Promise<void> {
        const query = `UPDATE schedule SET active = false WHERE schedule_id IN (?)`;
        const values = [scheduleIds];
        await transaction.query<ResultSetHeader>(query, values);
    }

    async deleteOrSoftDeleteSchedules(classId: number, scheduleIds: number[]): Promise<any> {
        const transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();

            // make sure schedules exist
            const schedulesExist = await this.verifySchedulesExist(classId, scheduleIds, transaction);
            if (!schedulesExist) {
                throw new Error('All schedules must contain a valid schedule_id.');
            }

            // unassign current volunteers from schedule
            await this.unassignVolunteers(scheduleIds, transaction);

            // check if there are any shifts still remaining (historic shifts)
            const schedulesToSetInactive = await this.getSchedulesToSetInactive(scheduleIds, transaction);

            // get schedules to delete completely
            const schedulesToDelete = await this.getSchedulesToDelete(schedulesToSetInactive, scheduleIds, transaction);

            // set these schedules as inactive
            if (schedulesToSetInactive.length > 0) {
                await this.setSchedulesInactive(schedulesToSetInactive, transaction);
            }

            // delete these schedules
            if (schedulesToDelete.length > 0) {
                await this.deleteSchedulesFromClass(classId, schedulesToDelete, transaction);
            }

            await transaction.commit();

            return {
                inactiveSchedules: schedulesToSetInactive,
                deletedSchedules: schedulesToDelete
            }
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private async getSchedulesToDelete(schedulesToSetInactive: number[], scheduleIds: number[], transaction: PoolConnection) {
        const query = `
                SELECT schedule_id
                FROM schedule
                WHERE schedule_id IN (?) 
                ${schedulesToSetInactive.length > 0 ? "AND schedule_id NOT IN (?)" : ""}
            `;
        const values = [scheduleIds, schedulesToSetInactive];
        const [results, _] = await transaction.query<ScheduleDB[]>(query, values);
        const schedulesToDelete = results.map((result) => result.schedule_id as number);

        console.log(schedulesToDelete)
        return schedulesToDelete;
    }

    private async getSchedulesToSetInactive(scheduleIds: number[], transaction: PoolConnection) {
        const query = `
                SELECT DISTINCT fk_schedule_id
                FROM shifts
                WHERE fk_schedule_id IN (?)
            `;
        const values = [scheduleIds];
        const [results, _] = await transaction.query<ShiftDB[]>(query, values);
        const schedulesToSetInactive = results.map((result) => result.fk_schedule_id);
        return schedulesToSetInactive;
    }

    async getSchedulesWithChanges(schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        const scheduleIds = schedules.map(schedule => schedule.schedule_id);
        const query = `
            SELECT
                schedule_id,
                day,
                TIME_FORMAT(start_time, '%H:%i') AS start_time,
                TIME_FORMAT(end_time, '%H:%i') AS end_time 
            FROM schedule 
            WHERE schedule_id IN (?)
        `;
        const values = [scheduleIds];
        const [results, _] = await transaction.query<ScheduleDB[]>(query, values);

        // get rid of leading zeros
        const formatTime = (time: string): string => {
            return time.replace(/^0/, '');
        }

        return schedules.filter((schedule) => {
            const scheduleInDb = results.find(result => result.schedule_id === schedule.schedule_id);
            return scheduleInDb && 
                (scheduleInDb.day != schedule.day ||
                formatTime(scheduleInDb.start_time) != formatTime(schedule.start_time) ||
                formatTime(scheduleInDb.end_time) != formatTime(schedule.end_time));
        })
    }

    async verifySchedulesExist(classId: number, scheduleIds: number[], transaction: PoolConnection): Promise<boolean> {
        const query = `SELECT * FROM schedule WHERE fk_class_id = ? AND schedule_id IN (?) AND active = true`;
        const values = [classId, scheduleIds];
        const [results, _] = await transaction.query<ScheduleDB[]>(query, values);
        return results.length === scheduleIds.length;
    }

    private async buildSchedulesWithVolunteers(schedules: ScheduleDB[], transaction: PoolConnection) {
        const schedulesWithVolunteers = schedules.filter(schedule => schedule.volunteer_ids !== undefined);
        const schedulesWithoutVolunteers = schedules.filter(schedule => schedule.volunteer_ids === undefined);

        // for schedules with no volunteers given, get current volunteers from db
        if (schedulesWithoutVolunteers.length > 0) {
            const scheduleIds = schedulesWithoutVolunteers.map(schedule => schedule.schedule_id as number);

            // get the currently assigned volunteers
            const assignments = await this.getCurrentAssignments(scheduleIds, transaction);

            schedulesWithoutVolunteers.forEach((schedule) => {
                const assignedVolunteers = assignments.get(schedule.schedule_id as number);
                schedulesWithVolunteers.push({
                    ...schedule,
                    volunteer_ids: assignedVolunteers ?? []
                });
            });
        }
        return schedulesWithVolunteers;
    }

    async updateSchedulesHistoricWithChanges(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<any> {
        if (schedules.length === 0) {
            return {
                addedSchedules: [],
                inactiveSchedules: []
            }
        }
        const schedulesWithVolunteers = await this.buildSchedulesWithVolunteers(schedules, transaction);
        const scheduleIds = schedulesWithVolunteers.map(schedule => schedule.schedule_id as number);

        // unassign volunteers from schedulese going inactive
        await this.unassignVolunteers(scheduleIds, transaction);

        // set schedules inactive
        await this.setSchedulesInactive(scheduleIds, transaction);

        // add new schedules to db with their assignments
        const result = await this.addSchedulesToClass(classId, schedulesWithVolunteers, transaction);

        return {
            addedSchedules: result,
            inactiveSchedules: scheduleIds
        }
    }

    async updateAssignments(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        if (schedules.length === 0) {
            return [];
        }
        const schedulesWithVolunteers = schedules.filter(schedule => schedule.volunteer_ids !== undefined);
        const scheduleIds = schedulesWithVolunteers.map(schedule => schedule.schedule_id as number);

        // unassign volunteers from schedulese going inactive
        await this.unassignVolunteers(scheduleIds, transaction);

        // make new assignments to the schedules
        await this.assignVolunteers(classId, schedulesWithVolunteers, transaction);

        return schedulesWithVolunteers;
    }

    async updateSchedulesHistoric(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<any> {
        if (schedules.length === 0) {
            return {
                addedSchedules: [],
                updatedSchedules: [],
                inactiveSchedules: []
            }
        }
        const schedulesWithChanges = await this.getSchedulesWithChanges(schedules, transaction);
        const schedulesWithoutChanges = schedules.filter(schedule => !schedulesWithChanges.includes(schedule));

        const { addedSchedules, inactiveSchedules } = await this.updateSchedulesHistoricWithChanges(classId, schedulesWithChanges, transaction);
        const updatedSchedules = await this.updateAssignments(classId, schedulesWithoutChanges, transaction);

        return {
            addedSchedules: addedSchedules,
            updatedSchedules: updatedSchedules,
            inactiveSchedules: inactiveSchedules
        }
    }

    async updateSchedulesNonHistoricWithChanges(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        if (schedules.length === 0) {
            return [];
        }
        const schedulesWithVolunteers = await this.buildSchedulesWithVolunteers(schedules, transaction);
        const scheduleIds = schedulesWithVolunteers.map(schedule => schedule.schedule_id as number);

        // unassign volunteers from schedulese going inactive
        await this.unassignVolunteers(scheduleIds, transaction);

        // safely update the schedules
        await this.updateSchedules(schedulesWithVolunteers, transaction);

        // add new schedules to db with their assignments
        await this.assignVolunteers(classId, schedulesWithVolunteers, transaction);

        return schedulesWithVolunteers;
    }


    async updateSchedulesNonHistoric(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        if (schedules.length === 0) {
            return [];
        }
        const schedulesWithChanges = await this.getSchedulesWithChanges(schedules, transaction);
        const schedulesWithoutChanges = schedules.filter(schedule => !schedulesWithChanges.includes(schedule));

        const updatedSchedules1 = await this.updateSchedulesNonHistoricWithChanges(classId, schedulesWithChanges, transaction);
        const updatedSchedules2 = await this.updateAssignments(classId, schedulesWithoutChanges, transaction);

        return updatedSchedules1.concat(updatedSchedules2);
    }

    async updateSchedulesForClass(classId: number, schedules: ScheduleDB[]): Promise<any> {
        const transaction = await connectionPool.getConnection();
        try {
            await transaction.beginTransaction();

            // verify all schedules exist in db
            const scheduleIds = schedules.map(schedule => schedule.schedule_id as number);
            const schedulesExist = await this.verifySchedulesExist(classId, scheduleIds, transaction);
            if (!schedulesExist) {
                throw new Error('All schedules must contain a valid schedule_id.');
            }

            // divide schedules into historic and non-historic
            const schedulesHistoric = await shiftModel.getSchedulesWithHistoricShifts(schedules, transaction);
            const schedulesNonHistoric = schedules.filter(schedule => !schedulesHistoric.includes(schedule));

            const result = await this.updateSchedulesHistoric(classId, schedulesHistoric, transaction);
            const updatedSchedules = await this.updateSchedulesNonHistoric(classId, schedulesNonHistoric, transaction);

            await transaction.commit();

            return {
                addedSchedules: result.addedSchedules,
                updatedSchedules: result.updatedSchedules.concat(updatedSchedules),
                inactiveSchedules: result.inactiveSchedules
            };
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
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

    async assignVolunteersByScheduleId(classId: number, scheduleId: number, volunteerIds: any[]): Promise<any> {
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

            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private async assignVolunteers(classId: number, schedules: any[], transaction: PoolConnection): Promise<void> {
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

    private async unassignVolunteers(scheduleIds: number[], transaction: PoolConnection): Promise<void> {
        const query = `DELETE FROM volunteer_schedule WHERE fk_schedule_id IN (?)`;
        const values = [scheduleIds];
        await transaction.query<ResultSetHeader>(query, values);

        // delete all future shifts for the schedules going inactive
        await shiftModel.deleteFutureShifts(scheduleIds, transaction);
    }

    private async updateSchedules(schedules: any[], transaction: PoolConnection): Promise<void> {
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