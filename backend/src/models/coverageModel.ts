import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { AbsenceRequestDB, ShiftDB } from "../common/databaseModels.js";
import connectionPool from "../config/database.js";
import { shiftModel } from "../config/models.js";
import queryBuilder from "../config/queryBuilder.js";

export default class CoverageModel {
     /**
      * Approves a coverage request by updating the absence request with the volunteer ID
      * and creating a new shift for the covering volunteer
      * 
      * @param request_id - The ID of the absence request to be covered
      * @param volunteer_id - The ID of the volunteer who will cover the shift
      */
     /**
      * Approves a coverage request by updating the absence request with the volunteer ID
      * and creating a new shift for the covering volunteer
      * 
      * @param request_id - The ID of the absence request to be covered
      * @param volunteer_id - The ID of the volunteer who will cover the shift
      * @throws Error if the absence request is not found or if the associated shift cannot be found
      */
     async approveCoverageRequest(request_id: number, volunteer_id: string): Promise<void> {
          const transaction = await connectionPool.getConnection();
          try {
               // Resolve the absence request
               const updateQuery = `
                    UPDATE absence_request 
                    SET covered_by = ?
                    WHERE request_id = ?
               `;
               const updateValues = [volunteer_id, request_id];
               const [updateResults] = await transaction.query<ResultSetHeader>(updateQuery, updateValues);

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

               const [findResults] = await transaction.query<ShiftDB[]>(findQuery, findValues);

               // Check if we found the associated shift or not
               if (findResults.length !== 1) {
                    throw new Error("Associated shift not found for the absence request");
               }

               const { fk_schedule_id, shift_date, duration } = findResults[0];

               // Make new shift for the covering volunteer
               await shiftModel.addShift({
                    fk_volunteer_id: volunteer_id,
                    fk_schedule_id: fk_schedule_id,
                    shift_date: shift_date,
                    duration: duration,
                    checked_in: false,
               } as ShiftDB, transaction);

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
      * @returns A ResultSetHeader containing information about the database operation
      */
     async insertCoverageRequest(request_id: number, volunteer_id: string): Promise<ResultSetHeader> {
          const query = `
               INSERT INTO coverage_request (request_id, volunteer_id)
               VALUES (?, ?)
          `;
          const values = [request_id, volunteer_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          return results;
     }

     /**
      * Deletes a coverage request entry from the database
      * 
      * @param request_id - The ID of the absence request
      * @param volunteer_id - The ID of the volunteer who offered to cover the shift
      * @param transaction - Optional database transaction for ensuring atomicity
      * @returns A ResultSetHeader containing information about the database operation
      * @throws Error if the coverage request is not found or already approved
      */
     async deleteCoverageRequest(request_id: number, volunteer_id: string, transaction?: PoolConnection): Promise<ResultSetHeader> {
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
      * Approves an absence request by updating its status in the database
      * 
      * @param request_id - The ID of the absence request to approve
      * @throws Error if the absence request is not found
      */
     async approveAbsenceRequest(request_id: number): Promise<void> {
          const transaction = await connectionPool.getConnection();
          try {
               const query = `
                    UPDATE absence_request 
                    SET approved = TRUE
                    WHERE request_id = ?
               `;
               const values = [request_id];
               const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

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

     /**
      * Creates a new absence request entry in the database
      * 
      * @param shift_id - The ID of the shift for which absence is requested
      * @param data - The absence request data to be inserted
      * @returns A ResultSetHeader containing information about the database operation
      */
     async insertAbsenceRequest(shift_id: number, data: AbsenceRequestDB): Promise<ResultSetHeader> {
          const query = queryBuilder('absence_request')
               .insert({
                    ...data,
                    fk_shift_id: shift_id,
               });
          
          const { sql, bindings } = query.toSQL();
          const [results, _] = await connectionPool.query<ResultSetHeader>(sql, bindings);

          return results;
     }

     /**
      * Deletes an absence request entry from the database
      * 
      * @param request_id - The ID of the absence request to delete
      * @returns A ResultSetHeader containing information about the database operation
      * @throws Error if the absence request is not found or already fulfilled
      */
     async deleteAbsenceRequest(request_id: number): Promise<ResultSetHeader> {
          const query = `
               DELETE FROM absence_request WHERE request_id = ?
          `;
          const values = [request_id];

          const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

          // Check if it was successfully deleted or not
          if (results.affectedRows === 0) {
               throw new Error("Shift absence request not found or already fulfilled");
          }

          return results;
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
                    'ar.request_id',
                    's.volunteer_id as volunteer_id',
                    'ar.category',
                    'ar.details',
                    'ar.comments',
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
                    END AS status`)
               ])
               .from({ ar: 'absence_request' })
               .join({ s: 'shifts' }, 'ar.fk_shift_id', 's.shift_id')
               .leftJoin({ cr: 'coverage_request' }, 'ar.request_id', 'cr.request_id')
               .where('ar.request_id', request_id);

          const { sql, bindings } = query.toSQL();
          const [results, _] = await connectionPool.query<any[]>(sql, bindings);

          // Check if absence request was found
          if (results.length === 0) {
               throw new Error("Absence request not found");
          }

          return results[0];
     }
}