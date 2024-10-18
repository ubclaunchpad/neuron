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

  deleteOverlappingAvailabilities(volunteer_id: string, availabilities: Availability[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (availabilities.length === 0) {
        return resolve([]);
      }

      const conditions = availabilities.map(() => `
        (day_of_week = ? AND (
          (start_time < ? AND end_time > ?) OR 
          (start_time >= ? AND start_time < ?) OR
          (end_time > ? AND end_time <= ?)
        ))
      `).join(' OR ');

      const query = `DELETE FROM availability WHERE fk_volunteer_id = ? AND (${conditions})`;
      const values = [volunteer_id, ...availabilities.flatMap(availability => [
        availability.day,
        availability.end_time, availability.start_time,
        availability.start_time, availability.end_time,
        availability.start_time, availability.end_time
      ])];

      connectionPool.query(query, values, (error: any, results: any) => {
        if (error) {
          return reject({
            status: 500,
            message: `An error occurred while executing the query: ${error}`
          });
        }
        resolve(results);
      });
    });
  }

  deleteAvailabilitiesByAvailabilityId(volunteer_id: string, availabilityIds: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM availability WHERE fk_volunteer_id = ? AND availability_id IN (?)`;
      const values = [volunteer_id, availabilityIds];

      connectionPool.query(query, values, (error: any, results: any) => {
        if (error) {
          return reject(`An error occurred while executing the query: ${error}`);
        }
        resolve(results);
      });
    });
  }

  updateAvailabilityByVolunteerId(volunteer_id: string, newAvailabilities: Availability[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {

        // Remove overlapping availabilities first
        await this.deleteOverlappingAvailabilities(volunteer_id, newAvailabilities);

        // Find days that are affected by the new availabilities
        const affectedDays = new Set(newAvailabilities.map(availability => availability.day));

        // Only get existing availabilities that will be affected + conform them to our interface
        const conformExistingAvailabilities = (await this.getAvailabilityByVolunteerId(volunteer_id))
          .filter((availability: any) => affectedDays.has(availability.day_of_week))
          .map((availability: any) => ({
            day: availability.day_of_week,
            start_time: availability.start_time.slice(0, 5),
            end_time: availability.end_time.slice(0, 5),
            availability_id: availability.availability_id
          }));

        // Combine old and new availabilities then sort them by day and start_time
        const allAvailabilities = [...conformExistingAvailabilities, ...newAvailabilities].sort((a, b) => {
          if (a.day !== b.day) {
            return a.day - b.day;
          }
          return a.start_time.localeCompare(b.start_time);
        });

        const mergedAvailabilities: Availability[] = [];
        const availiabilityIdsToDelete: Set<string> = new Set();

        // Merge availabilities that are adjacent to each other
        for (let i = 0; i < allAvailabilities.length; i++) {
          const current = allAvailabilities[i];

          if (mergedAvailabilities.length === 0) {
            mergedAvailabilities.push(current);
          } else {
            const last = mergedAvailabilities[mergedAvailabilities.length - 1];

            if (current.day === last.day && current.start_time === last.end_time) {
              last.end_time = current.end_time;

              // Keep track of pre-existing availabilities whose times are merged with the new availabilities to be created
              if (current.availability_id) {
                availiabilityIdsToDelete.add(current.availability_id);
              }
              if (last.availability_id) {
                availiabilityIdsToDelete.add(last.availability_id);
              }

            } else {
              mergedAvailabilities.push(current);
            }
          }
        }

        // Delete pre-existing availabilities that are merged with the new availabilities to be created
        if (availiabilityIdsToDelete.size > 0) {
          await this.deleteAvailabilitiesByAvailabilityId(volunteer_id, [...availiabilityIdsToDelete]);
        }

        // Insert the merged availabilities
        const result = await this.setAvailabilityByVolunteerId(volunteer_id, mergedAvailabilities);
        resolve(result);

      } catch (error) {
        return reject({
          status: 500,
          message: `An error occurred while executing the query: ${error}`
        });
      }
    })
  }
}
