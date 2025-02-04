import { ResultSetHeader } from 'mysql2/promise';
import { ShiftDB } from '../common/generated.js';
import connectionPool from '../config/database.js';

export default class ShiftModel {

     // get all the details of a shift
     async getShiftInfo(fk_volunteer_id: string, fk_schedule_id: number, shift_date: string): Promise<ShiftDB> {
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

     // create a new entry in the shift_coverage_request table
     async addShiftCoverageRequest(shift_id: number): Promise<ResultSetHeader> {
          const query = `
               INSERT INTO shift_coverage_request (fk_shift_id)
               VALUES (?)
          `;
          const values = [shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     // delete corresponding entry in pending_shift_coverage table
     async cancelCoverShift(request_id: number, shift_id: number): Promise<ResultSetHeader> {
          const query = `
               DELETE FROM pending_shift_coverage WHERE request_id = ? AND fk_shift_id = ?
          `;
          const values = [request_id, shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     // delete corresponding entry in shift_coverage_request table
     async deleteShiftCoverageRequest(request_id: number, shift_id: number): Promise<ResultSetHeader> {
          const query = `
               DELETE FROM shift_coverage_request WHERE request_id = ? AND fk_shift_id = ?
          `;
          const values = [request_id, shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     // modify a shift to indicate that a volunteer has checked in
     async checkInShift(shift_id: number): Promise<ResultSetHeader> {
          const query = `
               UPDATE shifts SET checked_in = 1 WHERE shift_id = ?
          `;
          const values = [shift_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
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