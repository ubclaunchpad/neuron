import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { AbsenceRequestDB } from "../common/databaseModels.js";
import connectionPool from "../config/database.js";
import queryBuilder from "../config/queryBuilder.js";

export default class CoverageModel {
  async approveCoverageRequest(
    request_id: number,
    volunteer_id: string
  ): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      const query = `
                    UPDATE absence_request 
                    SET covered_by = ?
                    WHERE request_id = ?
               `;
      const values = [volunteer_id, request_id];
      const [results, _] = await connectionPool.query<ResultSetHeader>(
        query,
        values
      );

      // Check if it was successfully updated or not
      if (results.affectedRows === 0) {
        throw new Error("Cover shift request not found");
      }

      await this.deleteCoverageRequest(request_id, volunteer_id);
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  }

  async insertCoverageRequest(
    request_id: number,
    volunteer_id: string
  ): Promise<ResultSetHeader> {
    const query = `
               INSERT INTO coverage_request (request_id, volunteer_id)
               VALUES (?, ?)
          `;
    const values = [request_id, volunteer_id];

    const [results, _] = await connectionPool.query<ResultSetHeader>(
      query,
      values
    );

    return results;
  }

  // delete corresponding entry in coverage_request table
  async deleteCoverageRequest(
    request_id: number,
    volunteer_id: string,
    transaction?: PoolConnection
  ): Promise<ResultSetHeader> {
    const connection = transaction || connectionPool;

    const query = `
               DELETE FROM coverage_request WHERE request_id = ? AND volunteer_id = ?
          `;
    const values = [request_id, volunteer_id];

    const [results, _] = await connection.query<ResultSetHeader>(query, values);

    // Check if it was successfully deleted or not
    if (results.affectedRows === 0) {
      throw new Error("Cover shift request not found or already approved");
    }

    return results;
  }

  async approveAbsenceRequest(request_id: number): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      const query = `
                    UPDATE absence_request 
                    SET approved = TRUE
                    WHERE request_id = ?
               `;
      const values = [request_id];
      const [results, _] = await connectionPool.query<ResultSetHeader>(
        query,
        values
      );

      // Check if it was successfully updated or not
      if (results.affectedRows === 0) {
        throw new Error("Shift absence request request not found");
      }
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  }

  // create a new entry in the absence_request table
  async insertAbsenceRequest(
    shift_id: number,
    data: AbsenceRequestDB
  ): Promise<ResultSetHeader> {
    const query = queryBuilder("absence_request").insert({
      ...data,
      fk_shift_id: shift_id,
    });

    const { sql, bindings } = query.toSQL();
    const [results, _] = await connectionPool.query<ResultSetHeader>(
      sql,
      bindings
    );

    return results;
  }

  // delete corresponding entry in absence_request table
  async deleteAbsenceRequest(request_id: number): Promise<ResultSetHeader> {
    const query = `
               DELETE FROM absence_request WHERE request_id = ?
          `;
    const values = [request_id];

    const [results, _] = await connectionPool.query<ResultSetHeader>(
      query,
      values
    );

    // Check if it was successfully deleted or not
    if (results.affectedRows === 0) {
      throw new Error("Shift absence request not found or already fulfilled");
    }

    return results;
  }

  async getAbsenceRequests(): Promise<any> {
    const query = `
               SELECT * FROM absence_request
          `;
    const [results, _] = await connectionPool.query<any>(query, []);

    return results;
  }
}