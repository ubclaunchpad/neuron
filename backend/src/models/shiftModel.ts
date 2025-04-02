import { DateTime } from 'luxon';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { ClassDB, ScheduleDB, ShiftDB } from '../common/databaseModels.js';
import { Frequency, ShiftQueryType, ShiftStatus } from '../common/interfaces.js';
import connectionPool from '../config/database.js';
import queryBuilder from '../config/queryBuilder.js';
import { wrapIfNotArray } from '../utils/generalUtils.js';

const timeZone = "America/Vancouver";

export default class ShiftModel {

     // get all the details of a shift
     async getShiftInfo(shift_id: number): Promise<ShiftDB> {
          const query = `
               SELECT 
                    s.duration,
                    sc.start_time,
                    sc.end_time,
                    u.l_name AS volunteer_l_name,
                    u.f_name AS volunteer_f_name,
                    i.l_name AS instructor_l_name,
                    i.f_name AS instructor_f_name, 
                    cl.class_name
               FROM 
                    neuron.shifts s
               JOIN 
                    neuron.schedule sc ON s.fk_schedule_id = sc.schedule_id
               JOIN 
                    neuron.volunteers v ON s.fk_volunteer_id = v.volunteer_id
               JOIN 
                    neuron.users u ON u.user_id = v.fk_user_id
               JOIN 
                    neuron.class cl ON sc.fk_class_id = cl.class_id
               JOIN
                    neuron.instructors i on i.instructor_id = sc.fk_instructor_id
               WHERE 
                    s.shift_id = ?       
          `;
          const values = [shift_id];

          const [results, _] = await connectionPool.query<ShiftDB[]>(query, values);

          return results[0];
     }

     // get all the details of a shift
     async getShiftByRequestId(shift_id: number): Promise<ShiftDB> {
          const query = `
               SELECT 
                    s.duration,
                    sc.start_time,
                    sc.end_time,
                    u.l_name AS volunteer_l_name,
                    u.f_name AS volunteer_f_name,
                    i.l_name AS instructor_l_name,
                    i.f_name AS instructor_f_name, 
                    cl.class_name
               FROM 
                    neuron.shifts s
               JOIN 
                    neuron.absence_request ar ON s.shift_id = ar.fk_shift_id
               WHERE 
                    s.shift_id = ?       
          `;
          const values = [shift_id];

          const [results, _] = await connectionPool.query<ShiftDB[]>(query, values);

          return results[0];
     }

     /**
      * Retrieves shifts from the database with optional filtering.
      *
      * @param {string} [params.volunteer_id] - The ID of the volunteer.
      *   - When omitted or when `type` is not 'coverage', returns only shifts assigned to the volunteer.
      *   - When `type` is 'coverage', excludes shifts assigned to the volunteer (i.e., returns shifts available for coverage).
      * @param {Date} [params.before] - Upper bound for the shift date. Shifts with a shift_date less than or equal to this date are included.
      * @param {Date} [params.after] - Lower bound for the shift date. Shifts with a shift_date greater than or equal to this date are included.
      * @param {'coverage'|'absence'} [params.type] - The type of filtering for coverage requests:
      *   - `'coverage'`: Only include shifts with an associated absence request not belonging to the specified volunteer.
      *   - `'absence'`: Only include shifts with an associated absence request belonging to the volunteer.
      * @param {'absence-pending'|'open'|'coverage-pending'|'resolved' or []} [params.status] - The status for coverage requests either as a single string or string array.
      * This is only checked when params.type is coverage or requesting, and includes all when not set:
      *   - `'open'`: Include open coverage shifts
      *   - `'pending'`: Include coverage shifts which have a pending coverage request associated
      *   - `'resolved'`: Include coverage shifts which have been resolved.
      *
      * @returns {Promise<any[]>} A promise that resolves to an array of shift records.
      *
      * @example
      * // Get all shifts assigned to volunteer '123'
      * getShifts({ volunteer_id: '123' });
      *
      * @example
      * // Get shifts available to volunteer '123' for coverage
      * getShifts({ volunteer_id: '123', type: 'coverage' });
      *
      * @example
      * // Get shifts which volunteer '123' for is requesting absence for
      * getShifts({ volunteer_id: '123', type: 'absence' });
      */
     async getShifts(params: {
          volunteer_id?: string,
          type?: ShiftQueryType,
          status?: ShiftStatus | ShiftStatus[],
          before?: Date,
          after?: Date
     } = {}): Promise<any[]> {
          // Construct subquery
          let subQuery = queryBuilder
            .select([
              "sh.shift_id",
              "sh.shift_date",
              "sh.duration",
              "sh.fk_volunteer_id AS volunteer_id",
              "sh.checked_in",
              "sc.day",
              "sc.start_time",
              "sc.end_time",
              "i.l_name AS instructor_l_name",
              "i.f_name AS instructor_f_name",
              "i.email AS instructor_email",
              "c.class_id",
              "c.class_name",
              "c.instructions",
              "c.zoom_link",
              "ar.request_id",
              "u.l_name AS volunteer_l_name",
              "u.f_name AS volunteer_f_name",
              queryBuilder.raw(`JSON_OBJECT(
                         'request_id', ar.request_id,
                         'category', ar.category,
                         'details', ar.details,
                         'comments', ar.comments,
                         'request_f_name', CASE
                              WHEN cr.request_id IS NOT NULL THEN u1.f_name
                              ELSE NULL
                         END,
                         'request_l_name', CASE
                              WHEN cr.request_id IS NOT NULL THEN u1.l_name
                              ELSE NULL
                         END,
                         'covering_volunteer_id', CASE 
                              WHEN ar.covered_by IS NOT NULL THEN ar.covered_by
                              WHEN cr.volunteer_id IS NOT NULL THEN cr.volunteer_id
                              ELSE NULL
                         END,
                         'status', CASE 
                              WHEN ar.request_id IS NOT NULL AND ar.approved IS NOT TRUE AND ar.covered_by IS NULL THEN 'absence-pending'
                              WHEN cr.request_id IS NOT NULL AND ar.covered_by IS NULL THEN 'coverage-pending'
                              WHEN ar.request_id IS NOT NULL AND ar.covered_by IS NULL THEN 'open'
                              WHEN ar.request_id IS NOT NULL AND ar.covered_by IS NOT NULL THEN 'resolved'
                              ELSE NULL
                         END
                    ) AS absence_request`),
            ])
            .from({ sh: "shifts" })
            .join({ sc: "schedule" }, "sh.fk_schedule_id", "sc.schedule_id")
            .join({ c: "class" }, "sc.fk_class_id", "c.class_id")
            .leftJoin(
              { i: "instructors" },
              "sc.fk_instructor_id",
              "i.instructor_id"
            )
            .leftJoin(
              { ar: "absence_request" },
              "sh.shift_id",
              "ar.fk_shift_id"
            )
            .leftJoin(
              { cr: "coverage_request" },
              "ar.request_id",
              "cr.request_id"
            )
            .leftJoin(
              { v: "volunteers" },
              "sh.fk_volunteer_id",
              "v.volunteer_id"
            )
            .leftJoin({ u: "users" }, "u.user_id", "v.fk_user_id")
            .leftJoin(
              { v1: "volunteers" },
              "cr.volunteer_id",
              "v1.volunteer_id"
            )
            .leftJoin({ u1: "users" }, "v1.fk_user_id", "u1.user_id")
            .as("sub");

          // Build the main query and add filters as before
          const query = queryBuilder.select('*').from(subQuery);

          // Filter by date
          if (params.before) {
               query.where('shift_date', '<=', params.before);
          }
          if (params.after) {
               query.where('shift_date', '>=', params.after);
          }

          // Only want coverage
          if (params.type === 'coverage' || params.type === 'absence') {
               query.whereNotNull('request_id');

               // Filter by status
               if (params?.status) {
                    query.whereRaw("JSON_EXTRACT(absence_request, '$.status') IN (?)", [wrapIfNotArray(params.status)]);
               }
          }

          // Updated filtering for volunteer_id to include shifts the volunteer is covering
          if (params.volunteer_id) {
               if (params.type === 'coverage') {
                    // For coverage: exclude shifts assigned to the volunteer
                    query.where('volunteer_id', '<>', params.volunteer_id);
               }
               else if (params.type == 'absence') {
                    // For absence: include shifts assigned to the volunteer
                    query.where('volunteer_id', params.volunteer_id);
               }
               else {
                    // For non-coverage and non-absence: include shifts assigned to the volunteer OR where they're covering.
                    query.where(q => {
                         q.where('volunteer_id', params.volunteer_id!)
                              .orWhere(queryBuilder.raw("JSON_EXTRACT(absence_request, '$.covering_volunteer_id')"), '=', params.volunteer_id!);
                    });
               }
          }

          // Order by date then time
          query.orderBy('shift_date').orderBy('start_time');

          // Construct query and bindings
          const { sql, bindings } = query.toSQL();
          const [results, _] = await connectionPool.query<any[]>(sql, bindings);

          return results.map(result => {
               if (!result.request_id) {
                    delete result.absence_request;
               }
               delete result.request_id;
               return result;
          })
     }

     // use getShifts instead
     async getShiftsByVolunteerIdAndMonth(volunteer_id: string, month: number, year: number): Promise<ShiftDB[]> {
          const query = `
               CALL GetShiftsByVolunteerIdAndMonth(?, ?, ?);
          `;

          const values = [volunteer_id, month, year];

          const [results, _] = await connectionPool.query<any>(query, values);

          return results[0]; // Value from procedure stored in the first value of the array
     }

     // modify a shift to indicate that a volunteer has checked in
     async updateShiftCheckIn(shift_id: number): Promise<ResultSetHeader> {
          const query = `
               UPDATE shifts SET checked_in = 1 WHERE shift_id = ?
          `;
          const values = [shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     private getDaysToAdd(frequency: Frequency) {
          switch (frequency) {
               case Frequency.weekly:
                    return 7;
               case Frequency.biweekly:
                    return 14;
               default:
                    throw new Error("Invalid frequency.");
          }
     }

     private getRecurringDates(classTimeline: any, startTime: string, dayNumber: number, frequency: Frequency): string[] {
          const result: string[] = [];

          // parse class start and end dates in PST
          let start = DateTime.fromISO(classTimeline.start_date, { zone: timeZone }).startOf("day");
          const end = DateTime.fromISO(classTimeline.end_date, { zone: timeZone }).endOf("day");

          // parse the current time in PST
          const now = DateTime.now().setZone(timeZone);

          // extract shift start time (given in PST)
          const [hours, minutes] = startTime.split(":").map(Number);

          // set start date and time
          let startDateTime = start.set({ hour: hours, minute: minutes });

          // ensure shifts are only scheduled in the future
          if (startDateTime < now) {
               start = now.startOf("day");
               startDateTime = start.set({ hour: hours, minute: minutes });

               // if today is the shift day but time has passed, skip to the next week for the first shift
               if (
                    (start.weekday % 7) === dayNumber && // luxon uses 1-based indexing for weekdays
                    (startDateTime.hour < now.hour ||
                    (startDateTime.hour === now.hour && startDateTime.minute <= now.minute))
               ) {
                    start = start.plus({ days: 7 });
               }
          }

          // move start to the first occurrence of the given day
          while ((start.weekday % 7) !== dayNumber) {
               start = start.plus({ days: 1 });
          }

          if (frequency === Frequency.once) {
               if (start <= end) 
                    result.push(start.toFormat("yyyy-MM-dd"));
               return result;
          }

          const daysToAdd = this.getDaysToAdd(frequency);

          // collect all shift dates within the range
          while (start <= end) {
               result.push(start.toFormat("yyyy-MM-dd"));
               start = start.plus({ days: daysToAdd });
          }

          return result;
     }

     // convert time in HH:MM format to minutes
     private getDurationInMinutes(startTime: string, endTime: string): number {

          const timeToMinutes = (time: string): number => {
               const [hours, minutes] = time.split(':').map(Number);
               return hours * 60 + minutes;
          };
          const startTimeInMinutes = timeToMinutes(startTime);
          const endTimeInMinutes = timeToMinutes(endTime);

          return Math.round(endTimeInMinutes - startTimeInMinutes);
     }

     async computeAndAddShifts(schedules: any[], classTimeline: any, transaction: PoolConnection): Promise<void> {
          // for every schedule, for every assigned volunteer, for every date in between the class's 
          // time line - we create a new shift
          let valuesClause = "";
          const values: any[][] = [];
          schedules.forEach(schedule => {

               if (!schedule.volunteer_ids) {
                    return;
               }

               const dates = this.getRecurringDates(classTimeline, schedule.start_time, schedule.day, schedule.frequency);
               const duration = this.getDurationInMinutes(schedule.start_time, schedule.end_time);

               schedule.volunteer_ids.forEach((volunteer_id: any) => {

                    dates.forEach(date => {
                         valuesClause = valuesClause.concat("(?),");
                         values.push([volunteer_id, schedule.schedule_id, date, duration]);
                    })
               })
          })
          valuesClause = valuesClause.slice(0, -1);

          if (valuesClause.length > 0) {
               const query = `INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES ${valuesClause}`;
               await transaction.query<ResultSetHeader>(query, values);
          }
     }

     async addShiftsForSchedules(classId: number, createdSchedules: any[], transaction: PoolConnection): Promise<void> {

          // get class start date and end date
          const query = `
               SELECT
                    DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                    DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
               FROM class WHERE class_id = ?
          `;
          const values = [classId];
          const [results, _] = await transaction.query<ScheduleDB[]>(query, values);
          const classTimeline = results[0];

          await this.computeAndAddShifts(createdSchedules, classTimeline, transaction);
     }

     async getSchedulesWithHistoricShifts(schedules: ScheduleDB[], transaction: PoolConnection): Promise<ScheduleDB[]> {
          const scheduleIds = schedules.map(schedule => schedule.schedule_id);
          const query = `
               SELECT DISTINCT sh.fk_schedule_id
               FROM shifts sh
               LEFT JOIN schedule sc 
               ON sh.fk_schedule_id = sc.schedule_id
               WHERE sh.fk_schedule_id IN (?)
               AND STR_TO_DATE(CONCAT(sh.shift_date, ' ', sc.start_time), '%Y-%m-%d %H:%i:%s') <= CONVERT_TZ(NOW(), 'UTC', 'America/Vancouver')
          `;
          const values = [scheduleIds];
          const [results, _] = await transaction.query<ShiftDB[]>(query, values);
          const scheduleIdsWithHistoricShifts = results.map(result => result.fk_schedule_id);
          return schedules.filter(schedule => scheduleIdsWithHistoricShifts.includes(schedule.schedule_id as number));
     }

     // delete all shifts that have not happened yet
     async deleteAllFutureShifts(scheduleIds: number[], transaction: PoolConnection): Promise<void> {

          const query1 = `
               SELECT shift_id 
               FROM shifts sh
               LEFT JOIN schedule sc 
               ON sh.fk_schedule_id = sc.schedule_id
               WHERE sh.fk_schedule_id IN (?)
               AND STR_TO_DATE(CONCAT(sh.shift_date, ' ', sc.start_time), '%Y-%m-%d %H:%i:%s') > CONVERT_TZ(NOW(), 'UTC', 'America/Vancouver')
          `;
          const values1 = [scheduleIds];
          const [results, _] = await transaction.query<ShiftDB[]>(query1, values1);

          const shiftIds = results.map(result => result.shift_id);

          if (shiftIds.length > 0) {
               const query2 = `DELETE FROM shifts WHERE shift_id IN (?)`;
               const values2 = [shiftIds];
               await transaction.query<ResultSetHeader>(query2, values2);
          }
     }

     async deleteShiftsInTimeline(timeline: any, scheduleIds: number[], transaction: PoolConnection): Promise<void> {
          
          // get shift ids for all future shifts inside given timeline
          const query1 = `
               SELECT sh.shift_id
               FROM neuron.shifts sh
               LEFT JOIN neuron.schedule sc 
               ON sh.fk_schedule_id = sc.schedule_id
               WHERE sh.fk_schedule_id IN (?)
               AND STR_TO_DATE(CONCAT(sh.shift_date, ' ', sc.start_time), '%Y-%m-%d %H:%i:%s') > CONVERT_TZ(NOW(), 'UTC', 'America/Vancouver')
               AND sh.shift_date >= STR_TO_DATE(?, '%Y-%m-%d')
               AND sh.shift_date <= STR_TO_DATE(?, '%Y-%m-%d');
          `;
          const values1 = [scheduleIds, timeline.start_date, timeline.end_date];
          const [results, _] = await transaction.query<ShiftDB[]>(query1, values1);

          const shiftIds = results.map(result => result.shift_id);
          if (shiftIds.length > 0) {
               const query2 = `DELETE FROM shifts WHERE shift_id IN (?)`;
               const values2 = [shiftIds];
               await transaction.query<ResultSetHeader>(query2, values2);
          }
     }

     // create a new shift. having fk_volunteer_id = null indicates an unassigned shift
     async addShift(shift: ShiftDB, transaction?: PoolConnection): Promise<ResultSetHeader> {
          const connection = transaction ?? connectionPool;
          const query = `
               INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration, checked_in)
               VALUES (?, ?, ?, ?, ?)
          `;
          const values = [
               shift.fk_volunteer_id,
               shift.fk_schedule_id,
               shift.shift_date,
               shift.duration,
               shift.checked_in
          ];

          const [results, _] = await connection.query<ResultSetHeader>(query, values);

          return results;
     }

     // update a shift by id
     async updateShift(shift_id: number, shift: ShiftDB): Promise<ResultSetHeader> {

          // Construct the SET clause dynamically
          const setClause = Object.keys(shift)
               .map((key) => `${key} = ?`)
               .join(", ");
          const query = `
               UPDATE shifts SET ${setClause} WHERE shift_id = ?;
          `;
          const values = [...Object.values(shift), shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     // delete a shift by id
     async deleteShift(shift_id: number): Promise<ResultSetHeader> {
          const query = `
               DELETE FROM shifts WHERE shift_id = ?;
          `;
          const values = [shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     async updateStartDate(startDate: string, oldStartDate: string, schedules: ScheduleDB[], transaction: PoolConnection): Promise<void> {
          let startDateObj = DateTime.fromISO(startDate, { zone: timeZone });
          let oldStartDateObj = DateTime.fromISO(oldStartDate, { zone: timeZone });

          // if we need to add shifts
          if (startDateObj < oldStartDateObj) {

               // last possible date for added shifts will be day prior to old start date
               oldStartDateObj = oldStartDateObj.minus({ days: 1 });

               const timeline = {
                    start_date: startDateObj.toFormat("yyyy-MM-dd"),
                    end_date: oldStartDateObj.toFormat("yyyy-MM-dd")
               };
               await this.computeAndAddShifts(schedules, timeline, transaction);

          // if we need to remove shifts
          } else {
               // latest possible date for deleted shifts will be day prior to new start date
               startDateObj = startDateObj.minus({ days: 1 });

               const timeline = {
                    start_date: oldStartDateObj.toFormat("yyyy-MM-dd"),
                    end_date: startDateObj.toFormat("yyyy-MM-dd")
               };
               await this.deleteShiftsInTimeline(
                    timeline, 
                    schedules.map(s => s.schedule_id as number), 
                    transaction
               );
          }
     }

     async updateEndDate(endDate: string, oldEndDate: string, schedules: ScheduleDB[], transaction: PoolConnection): Promise<void> {
          let endDateObj = DateTime.fromISO(endDate, { zone: timeZone });
          let oldEndDateObj = DateTime.fromISO(oldEndDate, { zone: timeZone });

          // if we need to remove shifts
          if (endDateObj < oldEndDateObj) {
               // earliest possible date for removed shifts will be day after new end date
               endDateObj = endDateObj.plus({ days: 1 });

               const timeline = {
                    start_date: endDateObj.toFormat("yyyy-MM-dd"),
                    end_date: oldEndDateObj.toFormat("yyyy-MM-dd")
               };
               await this.deleteShiftsInTimeline(
                    timeline, 
                    schedules.map(s => s.schedule_id as number), 
                    transaction
               );

          // if we need to add shifts
          } else {
               // earliest possible date for added shifts will be day after old end date
               oldEndDateObj = oldEndDateObj.plus({ days: 1 });

               const timeline = {
                    start_date: oldEndDateObj.toFormat("yyyy-MM-dd"),
                    end_date: endDateObj.toFormat("yyyy-MM-dd")
               };
               await this.computeAndAddShifts(schedules, timeline, transaction);
          }
     }

     async updateShiftsTimeline(
          class_id: number, 
          classData: Partial<ClassDB>, 
          oldClassData: ClassDB, 
          transaction: PoolConnection
     ): Promise<void> {

          // get all active schedules under this class, and their volunteers
          const query = `
               SELECT 
                    s.*, 
                    GROUP_CONCAT(vs.fk_volunteer_id) as volunteer_ids
               FROM 
                    schedule s
               LEFT JOIN 
                    volunteer_schedule vs 
               ON 
                    vs.fk_schedule_id = s.schedule_id
               WHERE 
                    s.fk_class_id = ? AND s.active = true
               GROUP BY schedule_id;
          `;
          const values = [class_id];
          const [results, _] = await connectionPool.query<ScheduleDB[]>(query, values);
          const schedules = results.map((schedule) => ({
               ...schedule,
               frequency: schedule.frequency as Frequency,
               volunteer_ids: schedule.volunteer_ids ? schedule.volunteer_ids.split(',') : []
          }));

          if (classData.start_date && classData.start_date !== oldClassData.start_date) 
               await this.updateStartDate(classData.start_date as string, oldClassData.start_date, schedules, transaction);

          if (classData.end_date && classData.end_date !== oldClassData.end_date)
               await this.updateEndDate(classData.end_date as string, oldClassData.end_date, schedules, transaction);
     }

     async deleteSpecificFutureShifts(transaction: PoolConnection): Promise<void> {  
          // use temp table to run a delete using joins
          await transaction.query(`
              DELETE sh FROM shifts sh
              INNER JOIN temp_delete_schedules tds 
              ON sh.fk_volunteer_id = tds.volunteer_id 
              AND sh.fk_schedule_id = tds.schedule_id
              LEFT JOIN schedule sc
              ON sh.fk_schedule_id = sc.schedule_id
              WHERE STR_TO_DATE(CONCAT(sh.shift_date, ' ', sc.start_time), '%Y-%m-%d %H:%i:%s') > CONVERT_TZ(NOW(), 'UTC', 'America/Vancouver')
          `);
      }
}