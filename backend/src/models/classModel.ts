import connectionPool from "../config/database.js";

export default class ClassesModel {
  getClassesByDay(day: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM class WHERE CAST(start_date as date) = ?`;

      const values = [day];
      connectionPool.query(query, values, (error: any, result: any) => {
        if (error) {
          reject({
            status: 500,
            message: `An error occurred while executing the query: ${error}`,
          });
        }
        resolve(result);
      });
    });
  }
}
