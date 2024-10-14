import connectionPool from "../config/database.js";
import { Availability } from "../common/types.js";

export default class AvailabilityModel {
  getAvailabilities(): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = "SELECT * FROM availability";

      connectionPool.query(query, [], (error: any, results: any) => {
        if (error) {
          return reject(
            `An error occurred while executing the query: ${error}`
          );
        }

        resolve(results);
      });
    });
  }

  getAvailabilityByVolunteerId(volunteer_id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = "SELECT * FROM availability WHERE fk_volunteer_id = ?";
      const values = [volunteer_id];

      connectionPool.query(query, values, (error: any, results: any) => {
        if (error) {
          return reject(
            `An error occurred while executing the query: ${error}`
          );
        }

        if (results.length == 0) {
          return reject("No availability found under the given ID");
        }

        resolve(results);
      });
    });
  }

  setAvailabilityByVolunteerId(volunteer_id: string, availabilities: Availability[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO availability (fk_volunteer_id, day_of_week, start_time, end_time) VALUES ?`;
      const values = availabilities.map((availability) => [
        volunteer_id,
        availability.day,
        availability.start_time,
        availability.end_time,
      ]);

      connectionPool.query(query, [values], (error: any, results: any) => {
        if (error) {
          return reject(`An error occurred while executing the query: ${error}`);
        }
        resolve(results);
      });
    });
  }

  // TODO: updateAvailability
}
