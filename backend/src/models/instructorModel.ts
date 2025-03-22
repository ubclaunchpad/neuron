import { ResultSetHeader } from 'mysql2';
import { InstructorDB } from '../common/databaseModels.js';
import connectionPool from '../config/database.js';
import { logModel } from '../config/models.js';

export default class InstructorModel {
  async getInstructors(): Promise<InstructorDB[]> {
    const query = `SELECT * FROM instructors`;

    const [results, _] = await connectionPool.query<InstructorDB[]>(query, []);
     
    return results;
  }

  async getInstructorById(instructor_id: string): Promise<InstructorDB> {
    const query = "SELECT * FROM instructors WHERE instructor_id = ?";
    const values = [instructor_id];

    const [results, _] = await connectionPool.query<InstructorDB[]>(query, values);

    if (results.length === 0) {
      throw {
        status: 400,
        message: `No instructor found under the given ID: ${instructor_id}`,
      };
    }
    
    return results[0];
  };

  async insertInstructor(instructor: InstructorDB, signoff: string): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      await transaction.beginTransaction();

      const query = `INSERT INTO 
      instructors (instructor_id, f_name, l_name, email)
      VALUES (?, ?, ?, ?)`;
      const { instructor_id, f_name, l_name, email } = instructor;
      const values = [instructor_id, f_name, l_name, email];

      // Perform insert
      await transaction.query<ResultSetHeader>(query, values);

      // Log to db
      await logModel.log({
        signoff,
        description: "TODO",
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  };

  async deleteInstructor(instructor_id: string, signoff: string): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      await transaction.beginTransaction();

      const query = `DELETE FROM instructors WHERE instructor_id = ?`;
      const values = [instructor_id];

      // Perform delete
      await transaction.query<ResultSetHeader>(query, values);

      // Log to db
      await logModel.log({
        signoff,
        description: "TODO",
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  };

  async editInstructor(instructor_id: string, instructor: InstructorDB, signoff: string): Promise<void> {
    const transaction = await connectionPool.getConnection();
    try {
      await transaction.beginTransaction();
      
      const query = `UPDATE instructors SET f_name = ?, l_name = ?, email = ? WHERE instructor_id = ?`;
      const { f_name, l_name, email } = instructor;
      const values = [f_name, l_name, email, instructor_id];

      // Perform update
      await transaction.query<ResultSetHeader>(query, values);

      // Log to db
      await logModel.log({
        signoff,
        description: "TODO",
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      // Rollback
      await transaction.rollback();
      throw error;
    }
  };
}