import connectionPool from "../config/database.js";

export default class ShiftModel {

    getShiftsByVolunteerId(volunteer_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM shifts WHERE fk_volunteer_id = ?";
            const values = [volunteer_id];
            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(`An error occurred while executing the query: ${error}`);
                }
                resolve(results);
            });
        });
    }

    getShiftsByDate(date: string) {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM shifts WHERE data = ?";
            const values = [date];
            connectionPool.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(`An error occurred while executing the query: ${error}`);
                }
                resolve(results);
            });
        });
    }
}