import { ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { ScheduleDB, ShiftDB, VolunteerScheduleDB } from '../common/databaseModels.js';
import connectionPool from '../config/database.js';
import ShiftModel from '../models/shiftModel.js';
import VolunteerModel from './volunteerModel.js';
import { shiftModel, volunteerModel } from '../config/models.js';

export default class ScheduleModel {
    async getAllSchedules(): Promise<ScheduleDB[]> {
        const query = `
            SELECT 
                s.*,
                GROUP_CONCAT(vs.fk_volunteer_id) as volunteer_ids
            FROM schedule s 
            LEFT JOIN volunteer_schedule vs
            ON s.schedule_id = vs.fk_schedule_id
            WHERE s.active = true
            GROUP BY s.schedule_id`;

        const [results, _] = await connectionPool.query<ScheduleDB[]>(query, []);

        return this.formatResults(results);
    }

    async getActiveSchedulesForClass(classId: number): Promise<ScheduleDB[]> {
        const query = `
            SELECT 
                s.*,
                i.f_name as instructor_f_name,
                i.l_name as instructor_l_name,
                i.email as instructor_email,
                GROUP_CONCAT(vs.fk_volunteer_id) as volunteer_ids
            FROM schedule s 
            LEFT JOIN volunteer_schedule vs
                ON s.schedule_id = vs.fk_schedule_id
            LEFT JOIN instructors i
                ON s.fk_instructor_id = i.instructor_id
            WHERE fk_class_id = ?
            AND s.active = true
            GROUP BY s.schedule_id`;
        const values = [classId];

        const [results, _] = await connectionPool.query<ScheduleDB[]>(query, values);
        
        return this.formatResults(results);
    }

    private async formatResults(schedules: ScheduleDB[]): Promise<any[]> {
        const volunteer_ids = schedules.flatMap(s => s.volunteer_ids ? s.volunteer_ids.split(',') : []);
        const volunteers = (await volunteerModel.getVolunteersByIds(volunteer_ids)).reduce((map: any, volunteer) => {
            map[volunteer.volunteer_id] = volunteer;
            return map;
        }, {});

        return schedules.map(schedule => {
            const schedule_volunteer_ids = schedule.volunteer_ids ? schedule.volunteer_ids.split(',') : []
            const schedule_volunteers = schedule_volunteer_ids.flatMap((id: string) => volunteers[id]);

            const { volunteer_ids, ...rest } = schedule;
            return {
                ...rest,
                volunteers: schedule_volunteers
            };
        });
    }

    private async addSchedulesWithTransaction(classId: number, scheduleItems: ScheduleDB[], transaction: PoolConnection): Promise<any> {
        const valuesClause1 = scheduleItems
            .map(() => '(?)')
            .join(", ");
        const query1 = `INSERT INTO schedule (fk_class_id, day, start_time, end_time, frequency, fk_instructor_id) VALUES ${valuesClause1}`;
        const values1 = scheduleItems.map((schedule) => [
            classId,
            schedule.day,
            schedule.start_time,
            schedule.end_time,
            schedule.frequency,
            schedule.fk_instructor_id
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
                frequency: schedule.frequency,
                fk_instructor_id: schedule.fk_instructor_id,
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
            await this.unassignAllVolunteers(scheduleIds, transaction);

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

    // return all schedules that will require shifts to be re-created
    async getModifiedSchedules(schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        const scheduleIds = schedules.map(schedule => schedule.schedule_id);
        const query = `
            SELECT
                schedule_id,
                day,
                TIME_FORMAT(start_time, '%H:%i') AS start_time,
                TIME_FORMAT(end_time, '%H:%i') AS end_time,
                frequency
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
                formatTime(scheduleInDb.end_time) != formatTime(schedule.end_time) ||
                scheduleInDb.frequency != schedule.frequency);
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

    async updateModifiedHistoric(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<any> {
        if (schedules.length === 0) {
            return {
                addedSchedules: [],
                inactiveSchedules: []
            }
        }
        const schedulesWithVolunteers = await this.buildSchedulesWithVolunteers(schedules, transaction);
        const scheduleIds = schedulesWithVolunteers.map(schedule => schedule.schedule_id as number);

        // unassign volunteers from schedules going inactive
        await this.unassignAllVolunteers(scheduleIds, transaction);

        // set schedules inactive
        await this.setSchedulesInactive(scheduleIds, transaction);

        // add new schedules to db with their assignments
        const addedSchedules = await this.addSchedulesToClass(classId, schedulesWithVolunteers, transaction);

        return {
            addedSchedules: addedSchedules,
            inactiveSchedules: scheduleIds
        }
    }

    async deleteVolunteerSchedulePairs(transaction: PoolConnection): Promise<void> {
        const query = `
            DELETE vs FROM volunteer_schedule vs
            INNER JOIN temp_delete_schedules tds 
            ON vs.fk_volunteer_id = tds.volunteer_id 
            AND vs.fk_schedule_id = tds.schedule_id
        `;
        await transaction.query<ResultSetHeader>(query);
    }

    async unassignSpecificVolunteers(pairs: { scheduleId: number, volunteerId: string }[], transaction: PoolConnection): Promise<void> {
        if (pairs.length == 0) {
            return;
        }

        // create temp table to hold pairs to unassign
        await transaction.query(`
            CREATE TEMPORARY TABLE temp_delete_schedules (
                volunteer_id CHAR(36) NOT NULL,
                schedule_id INT NOT NULL
            )
        `);

        const insertValues = pairs.map(() => "(?, ?)").join(",");
        const params = pairs.flatMap(p => [p.volunteerId, p.scheduleId]);

        await transaction.query(`INSERT INTO temp_delete_schedules (volunteer_id, schedule_id) VALUES ${insertValues}`, params);
        
        // delete from assignments table
        await this.deleteVolunteerSchedulePairs(transaction);

        // delete future shifts for volunteer-schedule pairs
        await shiftModel.deleteSpecificFutureShifts(transaction);

        // drop temp table
        await transaction.query("DROP TEMPORARY TABLE temp_delete_schedules");
    }

    // all schedules given are unmodified, meaning unchanged volunteers do not need to be reassigned. here we only need to 
    // add or delete future volunteers based on the assignments in the updated schedules. unchanged volunteers are not touched
    // to preserve data
    async updateAssignments(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        if (schedules.length === 0) {
            return [];
        }

        // only work with schedules where volunteer_ids is defined
        const schedulesWithVolunteers = schedules.filter(schedule => schedule.volunteer_ids !== undefined);
        const scheduleIds = schedulesWithVolunteers.map(schedule => schedule.schedule_id as number);

        // get the currently assigned volunteers
        const currentAssignments = await this.getCurrentAssignments(scheduleIds, transaction);

        const schedulesWithNewAssignments = schedulesWithVolunteers.map((schedule) => {
            const assignedVolunteers = currentAssignments.get(schedule.schedule_id as number);

            let addedVolunteerIds;
            if (assignedVolunteers)
                addedVolunteerIds = schedule.volunteer_ids.filter((volunteerId: string) => !assignedVolunteers.includes(volunteerId));
            else
                addedVolunteerIds = schedule.volunteer_ids;

            return {
                ...schedule,
                volunteer_ids: addedVolunteerIds
            }
        });

        // get volunteer-schedule pairs that need to be deleted
        const unassignments = schedulesWithVolunteers.flatMap((schedule) => {
            const assignedVolunteers = currentAssignments.get(schedule.schedule_id as number);

            let deletedVolunteerIds: string[] = [];
            if (assignedVolunteers)
                deletedVolunteerIds = assignedVolunteers.filter((volunteerId: string) => !schedule.volunteer_ids.includes(volunteerId));

            return deletedVolunteerIds.map(volunteerId => ({ scheduleId: schedule.schedule_id as number, volunteerId: volunteerId }));
        })

        // unassign volunteers from schedules
        await this.unassignSpecificVolunteers(unassignments, transaction);

        // // add new assignments to the schedules
        await this.assignVolunteers(classId, schedulesWithNewAssignments, transaction);

        return schedules;
    }

    async updateHistoric(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<any> {
        if (schedules.length === 0) {
            return {
                addedSchedules: [],
                updatedSchedules: [],
                inactiveSchedules: []
            }
        }
        const modifiedSchedules = await this.getModifiedSchedules(schedules, transaction);
        const unmodifiedSchedules = schedules.filter(schedule => !modifiedSchedules.includes(schedule));

        const { addedSchedules, inactiveSchedules } = await this.updateModifiedHistoric(classId, modifiedSchedules, transaction);
        const updatedSchedules = await this.updateUnmodified(classId, unmodifiedSchedules, transaction);

        return {
            addedSchedules: addedSchedules,
            updatedSchedules: updatedSchedules,
            inactiveSchedules: inactiveSchedules
        }
    }

    async updateModifiedNonHistoric(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        if (schedules.length === 0) {
            return [];
        }
        const schedulesWithVolunteers = await this.buildSchedulesWithVolunteers(schedules, transaction);
        const scheduleIds = schedulesWithVolunteers.map(schedule => schedule.schedule_id as number);

        // unassign volunteers from schedules
        await this.unassignAllVolunteers(scheduleIds, transaction);

        // safely update the schedules
        await this.updateSchedules(schedulesWithVolunteers, transaction);

        // assign volunteers to updated schedules
        await this.assignVolunteers(classId, schedulesWithVolunteers, transaction);

        return schedulesWithVolunteers;
    }


    async updateNonHistoric(classId: number, schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        if (schedules.length === 0) {
            return [];
        }
        const modifiedSchedules = await this.getModifiedSchedules(schedules, transaction);
        const unmodifiedSchedules = schedules.filter(schedule => !modifiedSchedules.includes(schedule));

        const updatedSchedules1 = await this.updateModifiedNonHistoric(classId, modifiedSchedules, transaction);
        const updatedSchedules2 = await this.updateUnmodified(classId, unmodifiedSchedules, transaction);

        return updatedSchedules1.concat(updatedSchedules2);
    }

    async updateUnmodified(classId: number, unmodifiedSchedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
        if (unmodifiedSchedules.length == 0) {
            return [];
        }

        // update the schedules in case fk_instructor_id was changed
        await this.updateSchedules(unmodifiedSchedules, transaction);

        // add or remove future volunteers from the schedules (unchanged volunteers are not touched to preserve data)
        return await this.updateAssignments(classId, unmodifiedSchedules, transaction);
    }

    /*
    Schedules with historic shifts need to be handled differently than schedules with no historic
    shifts. For example, if a schedule with historic shifts has its day of the week changed, then 
    we can not just update that schedule's 'day' field. This is because all the shifts that have 
    already happened will then also have their dependent 'shift_date' changed, which doesn't make 
    any sense.

    To preserve historic shift schedules, we need to instead set each updated schedule as inactive and 
    create a new active schedule as the updated version.

    If a schedule does not have any shifts in the past, then we can just update its fields as normal. 
    However, we still need to make sure all the shifts under that schedule still align correctly with
    the updated schedule (since shifts have a 'shift_date' field that depends on its schedule's 'day' 
    field and a 'duration' field that depends on its schedule's 'start_time' and 'end_time').
    */
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

            // divide into historic and non-historic schedules
            const schedulesHistoric = await shiftModel.getSchedulesWithHistoricShifts(schedules, transaction);
            const schedulesNonHistoric = schedules.filter(schedule => !schedulesHistoric.includes(schedule));

            const result = await this.updateHistoric(classId, schedulesHistoric, transaction);
            const updatedSchedules = await this.updateNonHistoric(classId, schedulesNonHistoric, transaction);

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
                    TIME_FORMAT(end_time, '%H:%i') AS end_time,
                    frequency,
                    fk_instructor_id
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

            return schedule;
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

    private async unassignAllVolunteers(scheduleIds: number[], transaction: PoolConnection): Promise<void> {
        if (scheduleIds.length === 0) {
            return;
        }
        const query = `DELETE FROM volunteer_schedule WHERE fk_schedule_id IN (?)`;
        const values = [scheduleIds];
        await transaction.query<ResultSetHeader>(query, values);

        // delete all future shifts for the schedules going inactive
        await shiftModel.deleteAllFutureShifts(scheduleIds, transaction);
    }

    private async updateSchedules(schedules: any[], transaction: PoolConnection): Promise<void> {
        let dayCase = '';
        let startTimeCase = '';
        let endTimeCase = '';
        let frequencyCase = '';
        let instructorCase = '';
        const scheduleIds: any[] = [];

        // build the CASE statements for each field and collect the schedule_ids
        schedules.forEach(schedule => {
            scheduleIds.push(schedule.schedule_id);
            dayCase += `WHEN schedule_id = ${schedule.schedule_id} THEN ${schedule.day} `;
            startTimeCase += `WHEN schedule_id = ${schedule.schedule_id} THEN '${schedule.start_time}' `;
            endTimeCase += `WHEN schedule_id = ${schedule.schedule_id} THEN '${schedule.end_time}' `;
            frequencyCase += `WHEN schedule_id = ${schedule.schedule_id} THEN '${schedule.frequency}' `;
            instructorCase += `WHEN schedule_id = ${schedule.schedule_id} THEN ${schedule.fk_instructor_id ? '\'' + schedule.fk_instructor_id + '\'' : null} `;
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
                    ELSE end_time END,
                frequency = CASE
                    ${frequencyCase}
                    ELSE frequency END,
                fk_instructor_id = CASE
                    ${instructorCase}
                    ELSE fk_instructor_id END
            WHERE schedule_id IN (?)
        `;
        const values = [scheduleIds];
        await transaction.query<ResultSetHeader>(query, values);
    }
}