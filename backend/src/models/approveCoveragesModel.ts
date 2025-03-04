// backend/src/models/approveCoveragesModel.ts
import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import connectionPool from "../config/database.js";
import {RowDataPacket} from "mysql2";

class ApproveCoveragesModel {
    async approveVolunteerCoverage(request_id: string): Promise<void> {
        const connection = await connectionPool.getConnection();
        try {
            await connection.beginTransaction();

            // Fetch the pending volunteer
            const [pendingResults] = await connection.query<RowDataPacket[]>(
                "SELECT pending_volunteer FROM pending_shift_coverage WHERE request_id = ?",
                [request_id]
            );

            if (pendingResults.length === 0) {
                throw new Error(`No pending request found for request_id ${request_id}`);
            }

            const pending_volunteer = pendingResults[0].pending_volunteer;

            // Update the shift_coverage_request table
            const [updateResults] = await connection.query<ResultSetHeader>(
                "UPDATE shift_coverage_request SET covered_by = ? WHERE request_id = ?",
                [pending_volunteer, request_id]
            );

            if (updateResults.affectedRows === 0) {
                throw new Error(`Failed to update shift_coverage_request for request_id ${request_id}`);
            }

            // Delete the entry from the pending_shift_coverage table
            const [deleteResults] = await connection.query<ResultSetHeader>(
                "DELETE FROM pending_shift_coverage WHERE request_id = ?",
                [request_id]
            );

            if (deleteResults.affectedRows === 0) {
                throw new Error(`Failed to delete pending request for request_id ${request_id}`);
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

export default ApproveCoveragesModel;