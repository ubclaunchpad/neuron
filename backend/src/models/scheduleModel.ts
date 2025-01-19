import { ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { ScheduleDB } from '../common/generated.js';
import connectionPool from '../config/database.js';

export default class ScheduleModel {
    async getSchedules(): Promise<ScheduleDB[]> {
        const query = "SELECT * FROM schedule";

        const [results, _] = await connectionPool.query<ScheduleDB[]>(query, []);

        return results;
    }

    async getSchedulesByClassId(classId: number): Promise<ScheduleDB[]> {
        const query = "SELECT * FROM schedule WHERE fk_class_id = ?";
        const values = [classId];

        const [results, _] = await connectionPool.query<ScheduleDB[]>(query, values);

        return results;
    }

    async setSchedulesByClassId(classId: number, scheduleItems: ScheduleDB[], transaction?: PoolConnection): Promise<any> {
        const connection = transaction ?? connectionPool;
        
        const valuesCaluse = scheduleItems
            .map(() => '(?)')
            .join(", ");
        const query = `INSERT INTO schedule (fk_class_id, day, start_time, end_time) VALUES ${valuesCaluse}`;
        const values = scheduleItems.map((schedule) => [
            classId,
            schedule.day,
            schedule.start_time,
            schedule.end_time,
        ]);
        
        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results;
    }

    async deleteSchedulesByScheduleId(classId: number, scheduleIds: number[], transaction?: PoolConnection): Promise<any> {
        const connection = transaction ?? connectionPool;

        const query = `DELETE FROM schedule WHERE fk_class_id = ? AND schedule_id IN (?)`;
        const values = [classId, scheduleIds];

        const [results, _] = await connection.query<ResultSetHeader>(query, values);

        return results;
    }

    async updateSchedulesByClassId(classId: number, newSchedules: ScheduleDB[]): Promise<void> {
        const transaction = await connectionPool.getConnection();

        try {
            await transaction.beginTransaction();

            // Get exisitng schedules and conform them to our Schedule interface
            const existingAvailabilities = (await this.getSchedulesByClassId(classId))
                .map((schedule: ScheduleDB) => ({
                    day: schedule.day,
                    start_time: schedule.start_time.slice(0, 5),
                    end_time: schedule.end_time.slice(0, 5),
                    schedule_id: schedule.schedule_id,
                    fk_class_id: schedule.fk_class_id
                } as ScheduleDB));

            const scheduleIdsToDelete: Set<number> = new Set();
            const schedulesToSkip: Set<ScheduleDB> = new Set();

            // Helper function to check if two schedules are an exact match
            const isExactMatch = (a: ScheduleDB, b: ScheduleDB) => (
                a.day === b.day &&
                a.start_time === b.start_time &&
                a.end_time === b.end_time
            );

            existingAvailabilities.forEach((existing: ScheduleDB) => {
                const matchingNewSchedule = newSchedules.find((newSchedule: ScheduleDB) => isExactMatch(existing, newSchedule));

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
            const newSchedulesToAdd = newSchedules.filter((newSchedule: ScheduleDB) => !schedulesToSkip.has(newSchedule));
            console.log(newSchedulesToAdd)

            if (scheduleIdsToDelete.size > 0) {
                await this.deleteSchedulesByScheduleId(classId, [...scheduleIdsToDelete], transaction);
            }

            if (newSchedulesToAdd.length > 0) {
                await this.setSchedulesByClassId(classId, newSchedulesToAdd, transaction);
            }
        
            await transaction.commit();
        } catch (error) {
            // Rollback
            await transaction.rollback();
            throw error;
        }
    }
}