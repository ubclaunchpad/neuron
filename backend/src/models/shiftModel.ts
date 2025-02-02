import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { ScheduleDB, ShiftDB } from '../common/generated.js';
import connectionPool from '../config/database.js';

export default class ShiftModel {

     // get all the details of a shift
     async getShiftInfo(fk_volunteer_id:string, fk_schedule_id:number, shift_date:string): Promise<ShiftDB> {
          const query = `
               SELECT 
                    s.duration,
                    sc.start_time,
                    sc.end_time,
                    v.l_name AS volunteer_l_name,
                    v.f_name AS volunteer_f_name,
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

      // create a new entry in the pending_shift_coverage table
     async requestToCoverShift(request_id: number, volunteer_id: string): Promise<ResultSetHeader> {
          const query = `
               INSERT INTO pending_shift_coverage (request_id, pending_volunteer)
               VALUES (?, ?)
          `;
          const values = [request_id, volunteer_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     getRecurringDates(date: any, day: number): string[] {
          const result: string[] = [];
      
          let start = new Date(date.start_date);
          const end = new Date(date.end_date);
     
          // find the first occurrence of the given day
          while (start.getUTCDay() !== day) {
               start.setUTCDate(start.getUTCDate() + 1);
          }
     
          // collect all occurrences of the given day until the end date
          while (start <= end) {
               result.push(start.toISOString().split('T')[0]); // store as YYYY-MM-DD
               start.setUTCDate(start.getUTCDate() + 7);
          }
      
          return result;
     }

     getDurationInMinutes(startTime: string, endTime: string): number {
          const start = new Date(`1970-01-01T${startTime}:00Z`);
          const end = new Date(`1970-01-01T${endTime}:00Z`);
      
          const durationMs = end.getTime() - start.getTime();
          const durationMinutes = durationMs / (1000 * 60);
      
          return Math.round(durationMinutes);
     }

     async addShiftsForSchedules(classId: number, createdSchedules: any[], transaction: PoolConnection): Promise<void> {

          // get class start date and end date
          const query1 = `SELECT start_date, end_date FROM class WHERE class_id = ?`;
          const values1 = [classId];
          const [results1, _] = await transaction.query<ScheduleDB[]>(query1, values1);

          // for every schedule, for every assigned volunteer, for every date in between the class's 
          // time line - we create a new shift
          let valuesClause2 = "";
          const values2: any[][] = [];
          createdSchedules.forEach(schedule => {

               if (!schedule.volunteer_ids) {
                    return;
               }

               schedule.volunteer_ids.forEach((volunteer_id: any) => {

                    const dates = this.getRecurringDates(results1[0], schedule.day);
                    const duration = this.getDurationInMinutes(schedule.start_time, schedule.end_time);

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