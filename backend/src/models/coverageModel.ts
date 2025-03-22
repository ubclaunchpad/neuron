import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { AbsenceRequestDB, ShiftDB } from "../common/databaseModels.js";
import connectionPool from "../config/database.js";
import { logModel, shiftModel } from "../config/models.js";
import queryBuilder from "../config/queryBuilder.js";

export default class CoverageModel {
  /**
   * Approves a coverage request by updating the absence request with the volunteer ID
   * and creating a new shift for the covering volunteer
   *
   * @param request_id - The ID of the absence request to be covered
   * @param volunteer_id - The ID of the volunteer who will cover the shift
   * @param signoff - the signoff of the approving admin
   */
  async approveCoverageRequest(
    request_id: number,
    volunteer_id: string,
    signoff: string
  ): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      await transaction.beginTransaction();

      // Resolve the absence request
      const updateQuery = `
                    UPDATE absence_request 
                    SET covered_by = ?
                    WHERE request_id = ?
               `;
      const updateValues = [volunteer_id, request_id];
      const [updateResults] = await transaction.query<ResultSetHeader>(
        updateQuery,
        updateValues
      );

      // Check if it was successfully updated or not
      if (updateResults.affectedRows === 0) {
        throw new Error("Cover shift request not found or already covered");
      }

      // Find old shift data
      const findQuery = `
                    SELECT 
                         s.*
                    FROM
                         neuron.shifts s
                    JOIN 
                         neuron.absence_request ar ON s.shift_id = ar.fk_shift_id
                    WHERE 
                         ar.request_id = ?       
               `;
      const findValues = [request_id];

      const [findResults] = await transaction.query<ShiftDB[]>(
        findQuery,
        findValues
      );

      // Check if we found the associated shift or not
      if (findResults.length !== 1) {
        throw new Error("Associated shift not found for the absence request");
      }

      const { fk_schedule_id, shift_date, duration } = findResults[0];

      // Make new shift for the covering volunteer
      await shiftModel.addShift(
        {
          fk_volunteer_id: volunteer_id,
          fk_schedule_id: fk_schedule_id,
          shift_date: shift_date,
          duration: duration,
          checked_in: false,
        } as ShiftDB,
        transaction
      );

      // Log approval
      await logModel.log({
        signoff, 
        description: "TODO", 
        volunteer_id,
        transaction
      });

      await transaction.commit();
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Creates a new coverage request entry in the database
   *
   * @param request_id - The ID of the absence request to be covered
   * @param volunteer_id - The ID of the volunteer who is offering to cover the shift
   */
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

  /**
   * Deletes a coverage request entry from the database
   *
   * @param request_id - The ID of the absence request
   * @param volunteer_id - The ID of the volunteer who offered to cover the shift
   * @param transaction - Optional database transaction for ensuring atomicity
   */
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

  /**
   * Deletes a coverage request and logs the deleting admin
   *
   * @param request_id - The ID of the absence request
   * @param volunteer_id - The ID of the volunteer who offered to cover the shift
   * @param signoff - the signoff of the denying admin
   */
  async denyCoverageRequest(
    request_id: number,
    volunteer_id: string,
    signoff: string
  ): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      await transaction.beginTransaction();

      // Delete the coverage request
      await this.deleteCoverageRequest(
        request_id,
        volunteer_id,
        transaction
      );

      // Log deny
      await logModel.log({
        signoff, 
        description: "TODO", 
        volunteer_id,
        transaction
      });

      await transaction.commit();
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Approves an absence request by updating its status in the database
   *
   * @param request_id - The ID of the absence request to approve
   */
  async approveAbsenceRequest(request_id: number, signoff: string): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      await transaction.beginTransaction();

      const query = `
                    UPDATE absence_request 
                    SET approved = TRUE
                    WHERE request_id = ?
               `;
      const values = [request_id];
      const [results] = await transaction.query<ResultSetHeader>(
        query,
        values
      );

      // Check if it was successfully updated or not
      if (results.affectedRows === 0) {
        throw new Error("Shift absence request request not found");
      }

      // Log approval
      const currentRequest = await this.getAbsenceRequest(request_id);
      await logModel.log({
        signoff, 
        description: "TODO", 
        volunteer_id: currentRequest.volunteer_id,
        transaction
      });

      await transaction.commit();
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Creates a new absence request entry in the database
   *
   * @param shift_id - The ID of the shift for which absence is requested
   * @param data - The absence request data to be inserted
   */
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

  /**
   * Deletes an absence request entry from the database
   *
   * @param request_id - The ID of the absence request to delete
   * @returns A ResultSetHeader containing information about the database operation
   */
  async deleteAbsenceRequest(request_id: number, transaction?: PoolConnection): Promise<ResultSetHeader> {
    const connection = transaction || connectionPool;
    const query = `
               DELETE FROM absence_request WHERE request_id = ?
          `;
    const values = [request_id];

    const [results, _] = await connection.query<ResultSetHeader>(
      query,
      values
    );

    // Check if it was successfully deleted or not
    if (results.affectedRows === 0) {
      throw new Error("Shift absence request not found or already fulfilled");
    }

    return results;
  }

  /**
   * Deletes a absence request and logs the denying admin
   *
   * @param request_id - The ID of the absence request
   * @param signoff - the signoff of the denying admin
   */
  async denyAbsenceRequest(
    request_id: number,
    signoff: string
  ): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      await transaction.beginTransaction();

      // Delete the coverage request
      await this.deleteAbsenceRequest(
        request_id,
        transaction
      );

      // Log deny
      const currentRequest = await this.getAbsenceRequest(request_id);
      await logModel.log({
        signoff, 
        description: "TODO", 
        volunteer_id: currentRequest.volunteer_id,
        transaction
      });

      await transaction.commit();
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  }  

  /**
   * Retrieves the absence request for a specific request ID
   *
   * @param request_id - The ID of the absence request to retrieve
   * @returns A promise that resolves to the absence request
   * @throws Error if the absence request is not found
   */
  async getAbsenceRequest(request_id: number): Promise<any> {
    const query = queryBuilder
      .select([
        "ar.request_id",
        "s.fk_volunteer_id as volunteer_id",
        "ar.category",
        "ar.details",
        "ar.comments",
        queryBuilder.raw(`CASE 
                         WHEN ar.covered_by IS NOT NULL THEN ar.covered_by
                         WHEN cr.volunteer_id IS NOT NULL THEN cr.volunteer_id
                         ELSE NULL
                    END AS covering_volunteer_id`),
        queryBuilder.raw(`CASE 
                         WHEN ar.request_id IS NOT NULL AND ar.approved IS NOT TRUE AND ar.covered_by IS NULL THEN 'absence-pending'
                         WHEN cr.request_id IS NOT NULL AND ar.covered_by IS NULL THEN 'coverage-pending'
                         WHEN ar.request_id IS NOT NULL AND ar.covered_by IS NULL THEN 'open'
                         WHEN ar.request_id IS NOT NULL AND ar.covered_by IS NOT NULL THEN 'resolved'
                         ELSE NULL
                    END AS status`),
      ])
      .from({ ar: "absence_request" })
      .join({ s: "shifts" }, "ar.fk_shift_id", "s.shift_id")
      .leftJoin({ cr: "coverage_request" }, "ar.request_id", "cr.request_id")
      .where("ar.request_id", request_id);

    const { sql, bindings } = query.toSQL();
    const [results, _] = await connectionPool.query<any[]>(sql, bindings);

    // Check if absence request was found
    if (results.length === 0) {
      throw new Error("Absence request not found");
    }

    return results[0];
  }
}