import { Schedule } from '../common/generated.js';
import connection from '../config/database.js';

export default class ScheduleModel {
    getSchedules(): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM schedule";

            connection.query(query, [], (error: any, results: any) => {
                if (error) {
                    return reject(
                        `An error occurred while executing the query: ${error}`
                    );
                }

                resolve(results);
            });
        });
    }

    getSchedulesByClassId(classId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM schedule WHERE fk_class_id = ?";
            const values = [classId];

            connection.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(
                        `An error occurred while executing the query: ${error}`
                    );
                }

                resolve(results);
            });
        });
    }

    setSchedulesByClassId(classId: string, scheduleItems: Schedule[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO schedule (fk_class_id, day, start_time, end_time) VALUES ?`;
            const values = scheduleItems.map((schedule) => [
                classId,
                schedule.day,
                schedule.start_time,
                schedule.end_time,
            ]);

            connection.query(query, [values], (error: any, results: any) => {
                if (error) {
                    return reject(`An error occurred while executing the query: ${error}`);
                }
                resolve(results);
            });
        });
    }

    deleteSchedulesByScheduleId(classId: string, scheduleIds: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM schedule WHERE fk_class_id = ? AND schedule_id IN (?)`;
            const values = [classId, scheduleIds];

            connection.query(query, values, (error: any, results: any) => {
                if (error) {
                    return reject(`An error occurred while executing the query: ${error}`);
                }
                resolve(results);
            });
        });
    }

    updateSchedulesByClassId(classId: string, newSchedules: Schedule[]): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {

                // Get exisitng schedules and conform them to our Schedule interface
                const existingAvailabilities = (await this.getSchedulesByClassId(classId))
                    .map((schedule: any) => ({
                        day: schedule.day,
                        start_time: schedule.start_time.slice(0, 5),
                        end_time: schedule.end_time.slice(0, 5),
                        schedule_id: schedule.availability_id
                    }));

                const scheduleIdsToDelete: Set<number> = new Set();
                const schedulesToSkip: Set<Schedule> = new Set();

                // Helper function to check if two schedules are an exact match
                const isExactMatch = (a: Schedule, b: Schedule) => (
                    a.day === b.day &&
                    a.start_time === b.start_time &&
                    a.end_time === b.end_time
                );

                existingAvailabilities.forEach((existing: Schedule) => {
                    const matchingNewSchedule = newSchedules.find((newSchedule: Schedule) => isExactMatch(existing, newSchedule));

                    // No new schedule matches the existing schedule -> Mark existing schedule for deletion
                    if (!matchingNewSchedule) {
                        if (existing.schedule_id) {
                            scheduleIdsToDelete.add(existing.schedule_id);
                        }

                        // Some new schedule matches the existing schedule -> We don't need to add the new schedule
                    } else {
                        schedulesToSkip.add(matchingNewSchedule);
                    }
                });

                // Filter out schedules that we don't need to add
                const newSchedulesToAdd = newSchedules.filter((newSchedule: Schedule) => !schedulesToSkip.has(newSchedule));

                if (scheduleIdsToDelete.size > 0) {
                    await this.deleteSchedulesByScheduleId(classId, [...scheduleIdsToDelete]);
                }

                if (newSchedulesToAdd.length > 0) {
                    const result = await this.setSchedulesByClassId(classId, newSchedulesToAdd);
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

    public addScheduleToDB(schedule: Schedule): Promise<any> {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO schedule 
                          (fk_class_id, day, start_time, end_time)
                          VALUES (?, ?, ?, ?)`;

            const { fk_class_id, day, start_time, end_time } = schedule;

            connection.query(query, [fk_class_id, day, start_time, end_time],
                (error: any, results: any) => {
                    if (error) {
                        return reject('Error adding schedule: ' + error);
                    }
                    resolve(results);
                });
        });
    }
}