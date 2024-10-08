import connection from '../config/database.js';

// Instructor model
export default class Instructor {

 public getInstructors(): Promise<any> {
   return new Promise((resolve, reject) => {
     const query = `SELECT * FROM instructors`;

     connection.query(query, [], (error: any, results: any) => {
       if (error) {
         return reject(error + 'Error fetching instructors');
       }
       resolve(results);
     });
   });
 }
}