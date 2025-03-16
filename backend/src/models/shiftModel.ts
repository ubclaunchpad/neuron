import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { ScheduleDB, ShiftDB } from '../common/databaseModels.js';
import { Frequency, ShiftQueryType, ShiftStatus } from '../common/interfaces.js';
import connectionPool from '../config/database.js';
import queryBuilder from '../config/queryBuilder.js';
import { wrapIfNotArray } from '../utils/generalUtils.js';

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
                    'sh.shift_id',
                    'sh.shift_date',
                    'sh.duration',
                    'sh.fk_volunteer_id AS volunteer_id',
                    'sh.checked_in',
                    'sc.day',
                    'sc.start_time',
                    'sc.end_time',
                    'i.l_name AS instructor_l_name',
                    'i.f_name AS instructor_f_name',
                    'i.email AS instructor_email',
                    'c.class_id',
                    'c.class_name',
                    'c.instructions',
                    'c.zoom_link',
                    'ar.request_id',
                    queryBuilder.raw(`JSON_OBJECT(
                         'request_id', ar.request_id,
                         'category', ar.category,
                         'details', ar.details,
                         'comments', ar.comments,
                         'covering_volunteer_id', CASE 
                              WHEN ar.covered_by IS NOT NULL THEN ar.covered_by
                              WHEN cr.volunteer_id IS NOT NULL THEN cr.volunteer_id
                              ELSE NULL
                         END,
                         'status', CASE 
                              WHEN ar.request_id IS NOT NULL AND ar.approved IS NOT TRUE THEN 'absence-pending'
                              WHEN ar.request_id IS NOT NULL AND ar.covered_by IS NULL THEN 'open'
                              WHEN cr.request_id IS NOT NULL THEN 'coverage-pending'
                              WHEN ar.request_id IS NOT NULL AND ar.covered_by IS NOT NULL THEN 'resolved'
                              ELSE NULL
                         END
                    ) AS absence_request`)
               ])
               .from({ sh: 'shifts' })
               .join({ sc: 'schedule' }, 'sh.fk_schedule_id', 'sc.schedule_id')
               .join({ c: 'class' }, 'sc.fk_class_id', 'c.class_id')
               .leftJoin({ i: 'instructors' }, 'sc.fk_instructor_id', 'i.instructor_id')
               .leftJoin({ ar: 'absence_request' }, 'sh.shift_id', 'ar.fk_shift_id')
               .leftJoin({ cr: 'coverage_request' }, 'ar.request_id', 'cr.request_id')
               .as('sub');

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
     async getShiftsByVolunteerId(volunteer_id: string): Promise<ShiftDB[]> {
          const query = "SELECT * FROM shifts WHERE fk_volunteer_id = ?";
          const values = [volunteer_id];

          const [results, _] = await connectionPool.query<ShiftDB[]>(query, values);

          return results;
     }

     // use getShifts instead
     async getShiftsByDate(date: string): Promise<ShiftDB[]> {
          const query = "SELECT * FROM shifts WHERE shift_date = ?";
          const values = [date];

          const [results, _] = await connectionPool.query<ShiftDB[]>(query, values);

          return results;
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

     // create a new entry in the coverage_request table
     async insertCoverageRequest(request_id: number, volunteer_id: string): Promise<ResultSetHeader> {
          const query = `
               INSERT INTO coverage_request (request_id, volunteer_id)
               VALUES (?, ?)
          `;
          const values = [request_id, volunteer_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     // delete corresponding entry in coverage_request table
     async deleteCoverageRequest(request_id: number, volunteer_id: number): Promise<ResultSetHeader> {
          const query = `
               DELETE FROM coverage_request WHERE request_id = ? AND volunteer_id = ?
          `;
          const values = [request_id, volunteer_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          // Check if it was successfully deleted or not
          if (results.affectedRows === 0) {
               throw new Error("Cover shift request not found or already approved");
          }

          return results;
     }

     // create a new entry in the absence_request table
     async insertAbsenceRequest(shift_id: number): Promise<ResultSetHeader> {
          const query = `
               INSERT INTO absence_request (fk_shift_id)
               VALUES (?)
          `;
          const values = [shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     // delete corresponding entry in absence_request table
     async deleteAbsenceRequest(request_id: number, shift_id: number): Promise<ResultSetHeader> {
          const query = `
               DELETE FROM absence_request WHERE request_id = ? AND fk_shift_id = ? AND covered_by IS NULL
          `;
          const values = [request_id, shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          // Check if it was successfully deleted or not
          if (results.affectedRows === 0) {
               throw new Error("Shift absence request not found or already fulfilled");
          }

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

     private formatDate(date: Date): string {
          const options: Intl.DateTimeFormatOptions = { timeZone: "America/Vancouver", year: "numeric", month: "2-digit", day: "2-digit" };
          const [{ value: year }, , { value: month }, , { value: day }] = 
               new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
          return `${year}-${month}-${day}`;
     }

     private getRecurringDates(classTimeline: any, startTime: string, dayNumber: number, frequency: Frequency): string[] {
          const result: string[] = [];

          let start = new Date(classTimeline.start_date); // start date, 12:00 AM (local time)
          const end = new Date(classTimeline.end_date); // end date, 12:00 AM (local time)
          end.setHours(23, 59); // set last possible shift time as end_date, 11:59 PM (local time)

          const [hours, minutes] = startTime.split(':').map(Number);
          const startDateAndTime = new Date(classTimeline.start_date);
          startDateAndTime.setHours(hours, minutes); // set using local time

          const now = new Date();

          // if start is earlier than right now (both are in UTC)
          if (startDateAndTime < now) {
               start = now;

               // if schedule starts today at exactly now or at an earlier time than now, we need to skip this week
               if (dayNumber === now.getDay() &&
                    startDateAndTime.getHours() <= now.getHours() &&
                    startDateAndTime.getMinutes() <= now.getMinutes()) {

                    start.setDate(start.getDate() + 7);
               }
               // NOTE: if the schedule starts today at a later time than now, all the shifts today will still be scheduled
          }

          // find the first occurrence of the given day (both day numbers are in local time)
          while (start.getDay() !== dayNumber) {
               start.setDate(start.getDate() + 1);
          }

          // if schedule only occurs once, then only add one date
          if (frequency === Frequency.once) {
               result.push(this.formatDate(start)); // format to YYYY-MM-DD in local time
               return result;
          }

          const daysToAdd = this.getDaysToAdd(frequency);
          // collect all occurrences of the given day until the end date (both are in UTC)
          while (start <= end) {
               result.push(this.formatDate(start)); // format to YYYY-MM-DD in local time
               start.setDate(start.getDate() + daysToAdd);
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

     async addShiftsForSchedules(classId: number, createdSchedules: any[], transaction: PoolConnection): Promise<void> {

          // get class start date and end date
          const query1 = `SELECT start_date, end_date FROM class WHERE class_id = ?`;
          const values1 = [classId];
          const [results, _] = await transaction.query<ScheduleDB[]>(query1, values1);
          const classTimeline = results[0];

          // for every schedule, for every assigned volunteer, for every date in between the class's 
          // time line - we create a new shift
          let valuesClause2 = "";
          const values2: any[][] = [];
          createdSchedules.forEach(schedule => {

               if (!schedule.volunteer_ids) {
                    return;
               }

               const dates = this.getRecurringDates(classTimeline, schedule.start_time, schedule.day, schedule.frequency);
               const duration = this.getDurationInMinutes(schedule.start_time, schedule.end_time);

               schedule.volunteer_ids.forEach((volunteer_id: any) => {

                    dates.forEach(date => {
                         valuesClause2 = valuesClause2.concat("(?),");
                         values2.push([volunteer_id, schedule.schedule_id, date, duration]);
                    })
               })
          })
          valuesClause2 = valuesClause2.slice(0, -1);

          if (valuesClause2.length > 0) {
               const query2 = `INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES ${valuesClause2}`;
               await transaction.query<ResultSetHeader>(query2, values2);
          }
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
     async deleteFutureShifts(scheduleIds: number[], transaction: PoolConnection): Promise<any> {

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

     // create a new shift. having fk_volunteer_id = null indicates an unassigned shift
     async addShift(shift: ShiftDB): Promise<ResultSetHeader> {
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

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

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
}