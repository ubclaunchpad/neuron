import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import sharp from 'sharp';
import { ClassDB } from '../common/generated.js';
import connectionPool from '../config/database.js';
import ImageModel from './imageModel.js';

const imageModel = new ImageModel();

export default class ClassesModel {
     async getClasses(): Promise<ClassDB[]> {
          const query = `SELECT * FROM class`;

          const [results, _] = await connectionPool.query<ClassDB[]>(query, []);
          return results;
     }

     async getClassesByDay(day: string): Promise<ClassDB[]> {
          const query =
               `SELECT * FROM class INNER JOIN schedule ON class.class_id = schedule.fk_class_id 
          WHERE ? BETWEEN CAST(start_date as date) AND CAST(end_date as date)
          AND WEEKDAY(?) = day`;
          const values = [day, day];

          const [results, _] = await connectionPool.query<ClassDB[]>(query, values);
          return results;
     }

     async getClassById(class_id: number): Promise<any> {
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
          `;
          const values = [class_id];

          const [results, _] = await connectionPool.query<ClassDB[]>(query, values);
          if (results.length == 0) {
               throw {
                    status: 400,
                    message: `No class found under the given ID: ${class_id}`,
               };
          }

          return results[0];
     }

     async addClass(newClass: ClassDB): Promise<ResultSetHeader> {
          const query = `INSERT INTO class 
                         (fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;

          const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category } = newClass;
          const values = [fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);
          
          return results;
     }

     async updateClass(class_id: number, classData: Partial<ClassDB>, transaction?: PoolConnection): Promise<ResultSetHeader> {
          const connection = transaction ?? connectionPool;

          // Construct the SET clause dynamically
          const setClause = Object.keys(classData)
               .map((key) => `${key} = ?`)
               .join(", ");
          const query = `UPDATE class SET ${setClause} WHERE volunteer_id = ?`;
          const values = [...Object.values(classData), class_id];

          const [results, _] = await connection.query<ResultSetHeader>(query, values);
          
          return results;
     }

     async upsertClassImage(class_id: number, image: Buffer): Promise<string> {
          const transaction = await connectionPool.getConnection();

          // Process image
          const processedImage = await sharp(image)
               .resize({ width: 300, fit: 'outside'})
               .toFormat('webp')
               .webp({ quality: 80 })
               .toBuffer();

          try {
               const query = `SELECT * FROM class WHERE class_id = ?`;
               const values = [class_id];

               const [results, _] = await transaction.query<ClassDB[]>(query, values);
               if (results.length == 0) {
                    throw {
                         status: 400,
                         message: `No class found under the given ID: ${class_id}`,
                    };
               }

               const classData = results[0];

               // Insert or update
               let imageId;
               if (classData.fk_image_id) {
                    await imageModel.updateImage(classData.fk_image_id, processedImage, transaction);
                    imageId = classData.fk_image_id;
               } else {
                    imageId = await imageModel.uploadImage(processedImage, transaction);
                    await this.updateClass(class_id, { fk_image_id: imageId } as ClassDB, transaction);
               }

               await transaction.commit();

               return imageId;
          } catch (error) {
               // Rollback
               await transaction.rollback();
               throw error;
          }
     }

     async deleteClass(class_id: number): Promise<void> {
          const transaction = await connectionPool.getConnection();
     
          try {
               const query1 = `SELECT * FROM class WHERE class_id = ?`;
               const values1 = [class_id];

               const [results, _] = await transaction.query<ClassDB[]>(query1, values1);
               if (results.length == 0) {
                    throw {
                         status: 400,
                         message: `No class found under the given ID: ${class_id}`,
                    };
               }

               const classData = results[0];
     
               // Delete profile photo before user
               if (classData.fk_image_id) {
                    await imageModel.deleteImage(classData.fk_image_id, transaction);
               }
     
               const query = `DELETE FROM class WHERE class_id = ?`;
               const values = [class_id];
     
               await transaction.query<ResultSetHeader>(query, values);
     
               await transaction.commit();
          } catch (error) {
               // Rollback
               await transaction.rollback();
               throw error;
          }
     }
}
