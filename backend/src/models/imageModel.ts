import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from "uuid";
import { ImageDB } from '../common/generated.js';
import poolConnection from '../config/database.js';

export default class ImageModel {
     async getImage(image_id: string): Promise<ImageDB> {
          const query = `SELECT * FROM images WHERE image_id = ?`;
          const values = [image_id];

          const [results, _] = await poolConnection.query<ImageDB[]>(query, values);
     
          return results[0];
     };

     async updateImage(image_id: string, image: Buffer, transaction?: PoolConnection): Promise<ResultSetHeader> {
          const connection = transaction ?? poolConnection;

          const query = `UPDATE images SET image = ? WHERE image_id = ?`;
          const values = [image, image_id];

          const [results, _] = await connection.query<ResultSetHeader>(query, values);

          return results;
     }

     async uploadImage(image: Buffer, transaction?: PoolConnection): Promise<string> {
          const connection = transaction ?? poolConnection;

          const query = `INSERT INTO images (image_id, image) VALUES (?, ?)`;
          const uuid = uuidv4();
          const values = [uuid, image];

          await connection.query<ResultSetHeader>(query, values);
     
          return uuid;
     }

     async deleteImage(image_id: string, transaction?: PoolConnection): Promise<void> {
          const connection = transaction ?? poolConnection;

          const query = `DELETE FROM images WHERE image_id = ?`;
          const values = [image_id];

          await connection.query<ResultSetHeader>(query, values);
     }
}
