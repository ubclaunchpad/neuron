import { Request, Response } from 'express';
import connectionPool from "../config/database.js";

export const getAllClasses = async (req: Request, res: Response): Promise<void> => {
	try {
		const classes = await new Promise<any[]>((resolve, reject) => {
			const query = 'SELECT * FROM neuron.class';
			
			connectionPool.query(query, (error, results) => {
				if (error) {
					reject(error);
				} else {
					resolve(results);
				}
			});
		});

		

          try {
               res.send({
                    message: classes,
               });
          } catch (error) {
               console.error(error);
               res.status(500).json({ message: 'Error fetching users', error });
          }
	} catch (error) {
		console.error('Error fetching classes:', error);
	}
};
