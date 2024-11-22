import connection from '../config/database.js';
import { Class } from '../common/interfaces.js'

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

     public getAllImages(): Promise<any> {
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

     public getImageByClassId(class_id: number): Promise<any> {
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