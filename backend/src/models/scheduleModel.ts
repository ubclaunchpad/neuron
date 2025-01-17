import { ResultSetHeader } from 'mysql2';
import { Schedule } from '../common/generated.js';
import connection from '../config/database.js';

export default class ScheduleModel {
    async getSchedules(): Promise<Schedule[]> {
        const query = "SELECT * FROM schedule";

        const [results, _] = await connection.query<Schedule[]>(query, []);

        return results;
    }

    async getSchedulesByClassId(classId: string): Promise<Schedule[]> {
        const query = "SELECT * FROM schedule WHERE fk_class_id = ?";
        const values = [classId];

        const [results, _] = await connection.query<Schedule[]>(query, values);

        return results;
    }

    async setSchedulesByClassId(classId: string, scheduleItems: Schedule[]): Promise<any> {
        const query = `INSERT INTO schedule (fk_class_id, day, start_time, end_time) VALUES ?`;
        const values = scheduleItems.map((schedule) => [
            classId,
            schedule.day,
            schedule.start_time,
            schedule.end_time,
        ]);
        
        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results;
    }

    async deleteSchedulesByScheduleId(classId: string, scheduleIds: number[]): Promise<any> {
        const query = `DELETE FROM schedule WHERE fk_class_id = ? AND schedule_id IN (?)`;
        const values = [classId, scheduleIds];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results;
    }

    async updateSchedulesByClassId(classId: string, newSchedules: Schedule[]): Promise<void> {
        try {
            await connection.beginTransaction();

            // Get exisitng schedules and conform them to our Schedule interface
            const existingAvailabilities = (await this.getSchedulesByClassId(classId))
                .map((schedule: Schedule) => ({
                    day: schedule.day,
                    start_time: schedule.start_time.slice(0, 5),
                    end_time: schedule.end_time.slice(0, 5),
                    schedule_id: schedule.schedule_id,
                    fk_class_id: schedule.fk_class_id
                } as Schedule));

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
            }
        
            await connection.commit();
        } catch (error) {
            // Rollback
            await connection.rollback();
            throw error;
        }
    }

    async addScheduleToDB(schedule: Schedule): Promise<ResultSetHeader> {
        const query = `INSERT INTO schedule 
                        (fk_class_id, day, start_time, end_time)
                        VALUES (?, ?, ?, ?)`;

        const { fk_class_id, day, start_time, end_time } = schedule;
        const values = [fk_class_id, day, start_time, end_time];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results;
    }
}