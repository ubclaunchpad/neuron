import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import sharp from 'sharp';
import { ClassDB, ScheduleDB } from '../common/databaseModels.js';
import connectionPool from '../config/database.js';
import ImageModel from './imageModel.js';
import ScheduleModel from './scheduleModel.js';

const imageModel = new ImageModel();
const scheduleModel = new ScheduleModel();

export default class ClassesModel {
     async getClasses(): Promise<ClassDB[]> {
          const query = `SELECT * FROM class`;

          const [results, _] = await connectionPool.query<ClassDB[]>(query, []);
          return results;
     }

     async getClassesByDay(day: string): Promise<ClassDB[]> {
          const query =`
          SELECT * FROM class 
               INNER JOIN schedule ON class.class_id = schedule.fk_class_id 
          WHERE 
               ? BETWEEN CAST(start_date as date) AND CAST(end_date as date) 
               AND schedule.active = true
               AND WEEKDAY(?) = day`;
          const values = [day, day];

          const [results, _] = await connectionPool.query<ClassDB[]>(query, values);
          return results;
     }

     async getClassById(class_id: number): Promise<any> {
          const query = `  
               SELECT 
                    c.*, 
                    i.l_name AS instructor_l_name,
                    i.f_name AS instructor_f_name,
                    i.email AS instructor_email
               FROM class c
               LEFT JOIN instructors i ON c.fk_instructor_id = i.instructor_id
               WHERE c.class_id = ?
          `;
          const values = [class_id];

          const [results, _] = await connectionPool.query<ClassDB[]>(query, values);
          if (results.length === 0) {
               throw {
                    status: 400,
                    message: `No class found under the given ID: ${class_id}`,
               };
          }

          const result = results[0];
          const schedules = await scheduleModel.getActiveSchedulesForClass(class_id);

          return {
               ...result,
               schedules: schedules
          };
     }

     async addClass(newClass: ClassDB, schedules?: ScheduleDB[]): Promise<any> {
          const transaction = await connectionPool.getConnection();

          try {
               await transaction.beginTransaction();

               const query = `INSERT INTO class 
                         (fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

               const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory } = newClass;
               const values = [fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory];

               const [results, _] = await transaction.query<ResultSetHeader>(query, values);
               const classId = results.insertId;

               let results2;
               if (schedules && schedules.length > 0) {
                    results2 = await scheduleModel.addSchedulesToClass(classId, schedules, transaction);
               }
               
               const finalResults = {
                    class_id: classId,
                    ...newClass,
                    schedules: results2
               };

               await transaction.commit();

               return finalResults;
          } catch (error) {
               await transaction.rollback();
               throw error;
          }
     }

     async updateClass(class_id: number, classData: Partial<ClassDB>, transaction?: PoolConnection): Promise<any> {
          const connection = transaction ?? connectionPool;

          // Construct the SET clause dynamically
          const setClause = Object.keys(classData)
               .map((key) => `${key} = ?`)
               .join(", ");
          const query = `UPDATE class SET ${setClause} WHERE class_id = ?`;
          const values = [...Object.values(classData), class_id];

          if (setClause.length > 0) {
               await connection.query<ResultSetHeader>(query, values);
          }

          return {
               class_id: class_id,
               ...classData
          };
     }

     async upsertClassImage(class_id: number, image: Buffer): Promise<string> {
          const transaction = await connectionPool.getConnection();

          // Process image
          const processedImage = await sharp(image)
               .resize({ width: 300, fit: 'outside'})
               .rotate()
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

     async deleteClass(class_id: number): Promise<ClassDB> {
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

               return classData;
          } catch (error) {
               // Rollback
               await transaction.rollback();
               throw error;
          }
     }
}
