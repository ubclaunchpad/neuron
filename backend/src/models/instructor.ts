import connection from '../config/database.js';

// Instructor model
export default class Instructor {

 public getInstructors(): Promise<any> {
   return new Promise((resolve, reject) => {
     const query = `SELECT * FROM <instructors-profile-table-name>`;

     connection.query(query, [], (error: any, results: any) => {
       if (error) {
         return reject(error);
       }
       resolve(results);
     });
   });
 }
}