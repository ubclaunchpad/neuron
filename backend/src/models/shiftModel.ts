import connection from '../config/database.js';

export default class ShiftModel {

     // get all the details of a shift
     public getShiftInfoFromDB(fk_volunteer_id:string, fk_schedule_id:number, shift_date:string): Promise<any> {
          return new Promise((resolve, reject) => {
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

               connection.query(query, [fk_volunteer_id, fk_schedule_id, shift_date], (error: any, results: any) => {
                    if (error) {
                         return reject({
                              status: 500,
                              message: `An error occurred while executing the query: ${error}`,
                         });
                    }
                    resolve(results);
               });
          });
     }

     // get all the shifts assigned to a single volunteer
     public getShiftsByVolunteerId(volunteer_id: string): Promise<any> {
          return new Promise((resolve, reject) => {
               const query = "SELECT * FROM shifts WHERE fk_volunteer_id = ?";
               const values = [volunteer_id];
               connection.query(query, values, (error: any, results: any) => {
                    if (error) {
                         return reject({
                              status: 500,
                              message: `An error occurred while executing the query: ${error}`
                         });
                    }
                    resolve(results);
               });
          });
     }

     // get all shifts occuring on given date
     public getShiftsByDate(date: string): Promise<any> {
          return new Promise((resolve, reject) => {
               const query = "SELECT * FROM shifts WHERE shift_date = ?";
               const values = [date];
               connection.query(query, values, (error: any, results: any) => {
                    if (error) {
                         return reject({
                              status: 500,
                              message: `An error occurred while executing the query: ${error}`,
                         });
                    }
                    resolve(results);
              });
          });
     }
}