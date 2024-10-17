import connectionPool from '../config/database.js';
import { Instructor } from '../common/types.js';

// Instructor model
export default class InstructorModel {

 getInstructors(): Promise<any> {
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

 getInstructorById(instructor_id: string): Promise<any> {
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
};

insertInstructor(instructor: Instructor): Promise<any> {
  return new Promise((resolve, reject) => {
      const query =
          "INSERT INTO instructors (instructor_id, f_name, l_name, email) VALUES (?, ?, ?, ?)";
      const values = [
          instructor.instructor_id,
          instructor.f_name,
          instructor.l_name,
          instructor.email
      ];

      connectionPool.query(query, values, (error: any, results: any) => {
          if (error) {
              return reject({
                  status: 500,
                  message: `An error occurred while executing the query: ${error}`,
              });
          }
          resolve(results);
      });
  });
};
}