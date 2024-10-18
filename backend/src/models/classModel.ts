import connection from '../config/database.js';
import {Class} from '../common/types.js'

export default class ClassesModel {

     public getClassesFromDB(): Promise<any> {
          return new Promise((resolve, reject) => {
               const query = `SELECT * FROM neuron.class`;

               connection.query(query, [], (error: any, results: any) => {
                    if (error) {
                         return reject(error + 'Error fetching classes');
                    }
                         resolve(results);
               });
          });
     }

     public addClassToDB(newClass: Class): Promise<Class> {
          return new Promise((resolve, reject) => {
               const query = `INSERT INTO neuron.class 
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