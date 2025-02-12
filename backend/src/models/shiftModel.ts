import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { ScheduleDB, ShiftDB } from '../common/databaseModels.js';
import connectionPool from '../config/database.js';

export default class ShiftModel {

     // get all the details of a shift
     async getShiftInfo(fk_volunteer_id: string, fk_schedule_id: number, shift_date: string): Promise<ShiftDB> {
          const query = `
               SELECT 
                    s.duration,
                    sc.start_time,
                    sc.end_time,
                    u.l_name AS volunteer_l_name,
                    u.f_name AS volunteer_f_name,
                    intrs.l_name AS instructor_l_name,
                    intrs.f_name AS instructor_f_name, 
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
                    neuron.instructors intrs on intrs.instructor_id = cl.fk_instructor_id
               WHERE 
                    s.fk_volunteer_id = ?
                    AND s.fk_schedule_id = ?
                    AND s.shift_date = ?;               
          `;
          const values = [fk_volunteer_id, fk_schedule_id, shift_date];

          const [results, _] = await connectionPool.query<ShiftDB[]>(query, values);

          return results[0];
     }

     // get all the shifts assigned to a single volunteer
     async getShiftsByVolunteerId(volunteer_id: string): Promise<ShiftDB[]> {
          const query = "SELECT * FROM shifts WHERE fk_volunteer_id = ?";
          const values = [volunteer_id];

          const [results, _] = await connectionPool.query<ShiftDB[]>(query, values);

          return results;
     }

     // get all shifts occurring on given date
     async getShiftsByDate(date: string): Promise<ShiftDB[]> {
          const query = "SELECT * FROM shifts WHERE shift_date = ?";
          const values = [date];

          const [results, _] = await connectionPool.query<ShiftDB[]>(query, values);

          return results;
     }

     // get all the shift details viewable to a volunteer for a specified month
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

     // create a new entry in the pending_shift_coverage table
     async insertCoverShift(request_id: number, volunteer_id: string): Promise<ResultSetHeader> {
          const query = `
               INSERT INTO pending_shift_coverage (request_id, pending_volunteer)
               VALUES (?, ?)
          `;
          const values = [request_id, volunteer_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     // delete corresponding entry in pending_shift_coverage table
     async deleteCoverShift(request_id: number, volunteer_id: number): Promise<ResultSetHeader> {
          const query = `
               DELETE FROM pending_shift_coverage WHERE request_id = ? AND pending_volunteer = ?
          `;
          const values = [request_id, volunteer_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          // Check if it was successfully deleted or not
          if (results.affectedRows === 0) {
               throw new Error("Cover shift request not found or already approved");
          }

          return results;
     }

     // create a new entry in the shift_coverage_request table
     async insertShiftCoverageRequest(shift_id: number): Promise<ResultSetHeader> {
          const query = `
               INSERT INTO shift_coverage_request (fk_shift_id)
               VALUES (?)
          `;
          const values = [shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     // delete corresponding entry in shift_coverage_request table
     async deleteShiftCoverageRequest(request_id: number, shift_id: number): Promise<ResultSetHeader> {
          const query = `
               DELETE FROM shift_coverage_request WHERE request_id = ? AND fk_shift_id = ? AND covered_by IS NULL
          `;
          const values = [request_id, shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          // Check if it was successfully deleted or not
          if (results.affectedRows === 0) {
               throw new Error("Shift coverage request not found or already fulfilled");
          }

          return results;
     }

     private getRecurringDates(classTimeline: any, startTime: string, dayNumber: number): string[] {
          const result: string[] = [];

          let start = new Date(classTimeline.start_date);
          const end = new Date(classTimeline.end_date);

          const [hours, minutes] = startTime.split(':').map(Number);
          const startDateAndTime = new Date(classTimeline.start_date);
          startDateAndTime.setHours(hours, minutes);

          const now = new Date();

          // if start is earlier than right now
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

          // find the first occurrence of the given day
          while (start.getDay() !== dayNumber) {
               start.setDate(start.getDate() + 1);
          }

          // collect all occurrences of the given day until the end date
          while (start <= end) {
               result.push(start.toISOString().split('T')[0]); // store as YYYY-MM-DD
               start.setDate(start.getDate() + 7);
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

               const dates = this.getRecurringDates(classTimeline, schedule.start_time, schedule.day);
               const duration = this.getDurationInMinutes(schedule.start_time, schedule.end_time);

               schedule.volunteer_ids.forEach((volunteer_id: any) => {

                    dates.forEach(date => {
                         valuesClause2 = valuesClause2.concat("(?),");
                         values2.push([volunteer_id, schedule.schedule_id, date, duration]);
                    })
               })
          })
          valuesClause2 = valuesClause2.slice(0, -1);

          const query2 = `INSERT INTO shifts (fk_volunteer_id, fk_schedule_id, shift_date, duration) VALUES ${valuesClause2}`;
          await transaction.query<ResultSetHeader>(query2, values2);
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