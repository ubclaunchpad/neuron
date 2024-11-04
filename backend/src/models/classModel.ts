import connection from '../config/database.js';

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

     public getClassById(class_id: string): Promise<any> {
          return new Promise((resolve, reject) => {
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
                              GROUP_CONCAT(v.f_name) AS volunteer_f_names
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
                              GROUP_CONCAT(s.day_of_week) AS days_of_week
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
     };
}

