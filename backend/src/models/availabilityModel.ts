import { Availability } from "../common/generated.js";
import connectionPool from "../config/database.js";

export default class AvailabilityModel {
  getAvailabilities(): Promise<Availability[]> {
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

  getAvailabilityByVolunteerId(volunteer_id: string): Promise<Availability[]> {
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
      const query = `INSERT INTO availability (fk_volunteer_id, day, start_time, end_time) VALUES ?`;
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

  deleteAvailabilitiesByAvailabilityId(volunteer_id: string, availabilityIds: number[]): Promise<any> {
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

  updateAvailabilityByVolunteerId(volunteer_id: string, newAvailabilities: Availability[]): Promise<Availability[]> {
    return new Promise(async (resolve, reject) => {
      try {

        // Get exisitng availabilities and conform them to our Availability type
        const existingAvailabilities = (await this.getAvailabilityByVolunteerId(volunteer_id))
          .map((availability: Availability) => ({
            day: availability.day,
            start_time: availability.start_time.slice(0, 5),
            end_time: availability.end_time.slice(0, 5),
            availability_id: availability.availability_id,
            fk_volunteer_id: availability.fk_volunteer_id
          }));

        const availabilityIdsToDelete: Set<number> = new Set();
        const availabilitiesToSkip: Set<Availability> = new Set();

        // Helper function to check if two availabilities are an exact match
        const isExactMatch = (a: Availability, b: Availability) => (
          a.day === b.day &&
          a.start_time === b.start_time &&
          a.end_time === b.end_time
        );

        existingAvailabilities.forEach((existing: Availability) => {
          const matchingNewAvailability = newAvailabilities.find((newAvailability: Availability) => isExactMatch(existing, newAvailability));

          // No new availability matches the existing availability -> Mark existing availability for deletion
          if (!matchingNewAvailability) {
            if (existing.availability_id) {
              availabilityIdsToDelete.add(existing.availability_id);
            }

            // Some new availability matches the existing availability -> We don't need to add the new availability
          } else {
            availabilitiesToSkip.add(matchingNewAvailability)
          }
        });

        // Filter out availabilities that we don't need to add
        const newAvailabilitiesToAdd = newAvailabilities.filter((newAvailability: Availability) => !availabilitiesToSkip.has(newAvailability));

        if (availabilityIdsToDelete.size > 0) {
          await this.deleteAvailabilitiesByAvailabilityId(volunteer_id, [...availabilityIdsToDelete]);
        }

        if (newAvailabilitiesToAdd.length > 0) {
          const result = await this.setAvailabilityByVolunteerId(volunteer_id, newAvailabilitiesToAdd);
          resolve(result);
        }

        resolve([]);

      } catch (error) {
        return reject({
          status: 500,
          message: `An error occurred while executing the query: ${error}`
        });
      }
    })
  }
}
