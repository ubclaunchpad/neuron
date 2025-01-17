import { ResultSetHeader } from 'mysql2/promise';
import sharp from 'sharp';
import { v4 as uuidv4 } from "uuid";
import { Image } from '../common/generated.js';
import connection from '../config/database.js';

export default class ImageService {
     async getImage(image_id: string): Promise<Image> {
          const query = `SELECT * FROM images WHERE image_id = ?`;
          const values = [image_id];

          const [results, _] = await connection.query<Image[]>(query, values);
     
          return results[0];
     };

     async updateImage(image_id: string, image: Buffer): Promise<ResultSetHeader> {
          const query = `UPDATE images SET image = ? WHERE image_id = ?`;
          const values = [image, image_id];

          const [results, _] = await connection.query<ResultSetHeader>(query, values);

          return results;
     }

     async uploadImage(image: Buffer): Promise<string> {
          const query = `INSERT INTO images (image_id, image) VALUES (?, ?)`;

          const processed = await sharp(image)
               .resize({ width: 300, fit: 'outside'})
               .toFormat('webp')
               .webp({ quality: 80 })
               .toBuffer();

          const uuid = uuidv4();
          const values = [uuid, processed];

          await connection.query<ResultSetHeader>(query, values);
     
          return uuid;
     }

     async deleteImage(image_id: string): Promise<void> {
          const query = `DELETE FROM images WHERE image_id = ?`;
          const values = [image_id];

          await connection.query<ResultSetHeader>(query, values);
     }
}
