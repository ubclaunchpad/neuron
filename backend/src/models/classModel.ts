import connection from '../config/database.js';
import {Class} from '../common/interfaces.js'

export default class ClassesModel {

     public getClasses(): Promise<any> {
          return new Promise((resolve, reject) => {
               const query = `SELECT * FROM class`;

               connection.query(query, [], (error: any, results: any) => {
                    if (error) {
                         return reject(error + 'Error fetching classes');
                    }
                         resolve(results);
               });
          });
     }

     public addClass(newClass: Class): Promise<Class> {
          return new Promise((resolve, reject) => {
               const query = `INSERT INTO class 
                             (fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date)
                             VALUES (?, ?, ?, ?, ?, ?)`;
   
               const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date } = newClass;
   
               connection.query(query, [fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date], 
               (error: any, results: any) => {
                   if (error) {
                       return reject('Error adding class: ' + error);
                   }
                   resolve(results);
               });
           });
     }
}