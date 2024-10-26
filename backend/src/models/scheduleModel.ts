import connection from '../config/database.js';
import { Schedule } from '../common/interfaces.js'

export default class ScheduleModel {
    public addScheduleToDB(schedule: Schedule): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO schedule 
                          (fk_class_id, day_of_week, start_time, end_time)
                          VALUES (?, ?, ?, ?)`;

            const { fk_class_id, day_of_week, start_time, end_time } = schedule;

            connection.query(query, [fk_class_id, day_of_week, start_time, end_time], 
            (error: any, results: any) => {
                if (error) {
                    return reject('Error adding schedule: ' + error);
                }
                resolve(results);
            });
        });
    }
}