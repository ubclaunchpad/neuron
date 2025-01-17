import { ResultSetHeader } from "mysql2/promise";
import { Availability } from "../common/generated.js";
import connection from "../config/database.js";

export default class AvailabilityModel {
  async getAvailabilities(): Promise<Availability[]> {
    const query = "SELECT * FROM availability";

    const [results, _] = await connection.query<Availability[]>(query, []);
    return results;
  }

  async getAvailabilityByVolunteerId(volunteer_id: string): Promise<Availability[]> {
    const query = "SELECT * FROM availability WHERE fk_volunteer_id = ?";
    const values = [volunteer_id];

    const [results, _] = await connection.query<Availability[]>(query, values);
    return results;
  }

  async setAvailabilityByVolunteerId(volunteer_id: string, availabilities: Availability[]): Promise<ResultSetHeader> {
    const query = `INSERT INTO availability (fk_volunteer_id, day, start_time, end_time) VALUES ?`;
    const values = availabilities.map((availability) => [
      volunteer_id,
      availability.day,
      availability.start_time,
      availability.end_time,
    ]);

    const [results, _] = await connection.query<ResultSetHeader>(query, values);
    return results;
  }

  async deleteAvailabilitiesByAvailabilityId(volunteer_id: string, availabilityIds: number[]): Promise<ResultSetHeader> {
    const query = `DELETE FROM availability WHERE fk_volunteer_id = ? AND availability_id IN (?)`;
    const values = [volunteer_id, availabilityIds];

    const [results, _] = await connection.query<ResultSetHeader>(query, values);
    return results;
  }

  async updateAvailabilityByVolunteerId(volunteer_id: string, newAvailabilities: Availability[]): Promise<void> {
    try {
      await connection.beginTransaction();

      // Get exisitng availabilities and conform them to our Availability type
      const existingAvailabilities = (await this.getAvailabilityByVolunteerId(volunteer_id))
        .map((availability: Availability) => ({
          day: availability.day,
          start_time: availability.start_time.slice(0, 5),
          end_time: availability.end_time.slice(0, 5),
          availability_id: availability.availability_id,
          fk_volunteer_id: availability.fk_volunteer_id
        } as Availability));

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
        await this.setAvailabilityByVolunteerId(volunteer_id, newAvailabilitiesToAdd);
      }

      await connection.commit();
    } catch (error) {
        // Rollback
        await connection.rollback();
        throw error;
    }
  }
}
