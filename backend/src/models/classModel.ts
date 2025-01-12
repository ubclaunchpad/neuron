import { Class, ClassImage } from '../common/generated.js';
import connection from '../config/database.js';

export default class ClassesModel {

     public getClasses(): Promise<any> {
          return new Promise((resolve, reject) => {
               const query = `SELECT * FROM class`;

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
               const query =
                    `SELECT * FROM class INNER JOIN schedule ON class.class_id = schedule.fk_class_id 
               WHERE ? BETWEEN CAST(start_date as date) AND CAST(end_date as date)
               AND WEEKDAY(?) = day`;

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

     public getClassById(class_id: string): Promise<Class> {
          return new Promise((resolve, reject) => {

               // All class information is in one entry. Volunteer names, days of week, start times and end times can have multiple 
               // values and seperated by commas. Days of week, start times and end times should have the same length. 
               const query =
                    `  
               WITH 
                    params AS (
                         SELECT ? AS id
                    ),
                    class_info AS (
                         SELECT 
                              c.class_id,
                              c.class_name,
                              c.instructions,
                              c.zoom_link, 
                              i.l_name AS instructor_l_name,
                              i.f_name AS instructor_f_name
                         FROM class c
                         LEFT JOIN instructors i ON c.fk_instructor_id = i.instructor_id
                         WHERE c.class_id = (SELECT id FROM params)
                    ),
                    volunteer_info AS (
                         SELECT 
                              vc.fk_class_id AS class_id,
                              GROUP_CONCAT(v.l_name) AS volunteer_l_names,
                              GROUP_CONCAT(v.f_name) AS volunteer_f_names,
                              GROUP_CONCAT(v.fk_user_id) AS volunteer_user_ids
                         FROM volunteer_class vc
                         LEFT JOIN volunteers v ON vc.fk_volunteer_id = v.volunteer_id
                         WHERE vc.fk_class_id = (SELECT id FROM params)
                         GROUP BY vc.fk_class_id
                    ),
                    schedule_info AS (
                         SELECT 
                              s.fk_class_id AS class_id,
                              GROUP_CONCAT(s.start_time) AS start_times,
                              GROUP_CONCAT(s.end_time) AS end_times,
                              GROUP_CONCAT(s.day) AS days_of_week
                         FROM schedule s
                         WHERE s.fk_class_id = (SELECT id FROM params)
                         GROUP BY s.fk_class_id
                    )

               SELECT 
                    ci.class_name,
                    ci.instructions,
                    ci.zoom_link,
                    ci.instructor_l_name,
                    ci.instructor_f_name,
                    COALESCE(vi.volunteer_l_names, null) AS volunteer_l_names,
                    COALESCE(vi.volunteer_f_names, null) AS volunteer_f_names,
                    COALESCE(vi.volunteer_user_ids, null) AS volunteer_user_ids,
                    COALESCE(si.start_times, null) AS start_times,
                    COALESCE(si.end_times, null) AS end_times,
                    COALESCE(si.days_of_week, null) AS days_of_week
               FROM class_info ci
               LEFT JOIN volunteer_info vi ON ci.class_id = vi.class_id
               LEFT JOIN schedule_info si ON ci.class_id = si.class_id;
               `
                    ;

               connection.query(query, [class_id], (error: any, results: any) => {
                    if (error) {
                         reject({
                              status: 500,
                              message: `An error occurred while executing the query: ${error}`,
                         });
                    }
                    if (results.length == 0) {
                         reject({
                              status: 400,
                              message: `No class found under the given ID: ${class_id}`,
                         });
                    }

                    console.log(results);

                    resolve(results[0]);
               });
          });
     }



     public addClass(newClass: Class): Promise<Class> {
          return new Promise((resolve, reject) => {
               const query = `INSERT INTO class 
                             (fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`;

               const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category } = newClass;

               connection.query(query, [fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category],
                    (error: any, results: any) => {
                         if (error) {
                              return reject('Error adding class: ' + error);
                         }
                         resolve(results);
                    });
          });
     }

     public getAllImages(): Promise<ClassImage[]> {
          return new Promise((resolve, reject) => {
               const query = `SELECT * FROM class_image`;

               connection.query(query, [], (error: any, results: any) => {
                    if (error) {
                         return reject('Error fetching images: ' + error);
                    }
                    resolve(results);
               });
          });
     }

     public getImageByClassId(class_id: number): Promise<ClassImage> {
          return new Promise((resolve, reject) => {
               const query = `SELECT image FROM class_image WHERE fk_class_id = ?`;

               connection.query(query, [class_id], (error: any, results: any) => {
                    if (error) {
                         return reject('Error fetching image: ' + error);
                    }
                    resolve(results);
               });
          })
     };

     public uploadImage(fk_class_id: number, image: Buffer): Promise<any> {
          return new Promise((resolve, reject) => {
               const query = `INSERT INTO class_image
                              (fk_class_id, image)
                              VALUES (?, ?)`;

               connection.query(query, [fk_class_id, image], (error: any, results: any) => {
                    if (error) {
                         return reject('Error uploading image: ' + error);
                    }
                    resolve(results);
               });
          });
     }
}
