import { ResultSetHeader } from 'mysql2';
import { InstructorDB } from '../common/databaseModels.js';
import connectionPool from '../config/database.js';

// Instructor model
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

  async insertInstructor(instructor: InstructorDB): Promise<ResultSetHeader> {
    const query =
      "INSERT INTO instructors (instructor_id, f_name, l_name, email) VALUES (?, ?, ?, ?)";

    const { instructor_id, f_name, l_name, email } = instructor;
    const values = [instructor_id, f_name, l_name, email];

    const [results, _] = await connectionPool.query<ResultSetHeader>(query, values);

    return results;
  };
}