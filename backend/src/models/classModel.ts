import connection from "../config/database.js";
import {Class} from '../common/interfaces.js'

export default class ClassesModel {

     public getClasses(): Promise<any> {
          return new Promise((resolve, reject) => {
               const query = `SELECT * FROM class JOIN schedule ON class.class_id = schedule.fk_class_id`;

      connection.query(query, [], (error: any, results: any) => {
        if (error) {
          reject(error + "Error fetching classes");
        }
        resolve(results);
      });
    });
  }

  public getClassesByDay(day: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM class INNER JOIN schedule ON class.class_id = schedule.fk_class_id 
      WHERE ? BETWEEN CAST(start_date as date) AND CAST(end_date as date)
      AND WEEKDAY(?) = day_of_week`;

      const values = [day, day];
      connection.query(query, values, (error: any, result: any) => {
        if (error) {
          reject({
            status: 500,
            message: error,
          });
        }
        resolve(result);
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