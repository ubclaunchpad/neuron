import connectionPool from '../config/database.js';

// Instructor model
export default class Instructor {

 public getInstructors(): Promise<any> {
   return new Promise((resolve, reject) => {
     const query = `SELECT * FROM instructors`;

     connectionPool.query(query, [], (error: any, results: any) => {
       if (error) {
        return reject(`An error occurred while executing the query: ${error}`);
       }
       resolve(results);
     });
   });
 }

 public getInstructorById(instructor_id: string): Promise<any> {
  return new Promise((resolve, reject) => {
      const query = "SELECT * FROM instructors WHERE instructor_id = ?";
      const values = [instructor_id];

      connectionPool.query(query, values, (error: any, results: any) => {
          if (error) {
            return reject(`An error occurred while executing the query: ${error}`);
          }
          if (results.length == 0) {
              return reject("No instructor found under the given ID");
          }
          resolve(results[0]);
      });
  });
}
}