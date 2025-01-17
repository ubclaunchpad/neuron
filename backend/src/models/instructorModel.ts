import { ResultSetHeader } from 'mysql2';
import { Instructor } from '../common/generated.js';
import connection from '../config/database.js';

// Instructor model
export default class InstructorModel {
  async getInstructors(): Promise<Instructor[]> {
    const query = `SELECT * FROM instructors`;

    const [results, _] = await connection.query<Instructor[]>(query, []);
     
    return results;
  }

  async getInstructorById(instructor_id: string): Promise<Instructor> {
    const query = "SELECT * FROM instructors WHERE instructor_id = ?";
    const values = [instructor_id];

    const [results, _] = await connection.query<Instructor[]>(query, values);

    if (results.length === 0) {
      throw {
        status: 400,
        message: `No instructor found under the given ID: ${instructor_id}`,
      };
    }
    
    return results[0];
  };

  async insertInstructor(instructor: Instructor): Promise<ResultSetHeader> {
    const query =
      "INSERT INTO instructors (instructor_id, f_name, l_name, email) VALUES (?, ?, ?, ?)";

    const { instructor_id, f_name, l_name, email } = instructor;
    const values = [instructor_id, f_name, l_name, email];

    const [results, _] = await connection.query<ResultSetHeader>(query, values);

    return results;
  };
}