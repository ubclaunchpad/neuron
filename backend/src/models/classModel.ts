import connection from '../config/database.js';

export default class ClassesModel {

     public getClassesFromDB(): Promise<any> {
          return new Promise((resolve, reject) => {
               const query = `SELECT * FROM neuron.class`;

               connection.query(query, [], (error: any, results: any) => {
                    if (error) {
                         return reject(error + 'Error fetching instructors');
                    }
                         resolve(results);
               });
          });
     }
}