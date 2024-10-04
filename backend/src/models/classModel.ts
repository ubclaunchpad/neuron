import connectionPool from "../config/database.js";

const getUsersFromDB = (): Promise<any[]> => {
     return new Promise((resolve, reject) => {
          const query = 'SELECT * FROM neuron.users';
     
          connectionPool.query(query, (error, results) => {
               if (error) {
                    reject(error);
               } else {
                    resolve(results);
               }
          });
     });
};

export default getUsersFromDB;