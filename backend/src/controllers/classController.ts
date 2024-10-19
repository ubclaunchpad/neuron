import { Request, Response } from 'express';
import ClassesModel from '../models/classModel.js';

export default class ClassesController {

	public async getAllClasses(req: Request, res: Response){
		const classesModel = new ClassesModel();
		
		try {
			const classes = await classesModel.getClassesFromDB();
			res.status(200).json(classes);
		} catch (error) {
			return res.status(500).json({
				error: `Internal server error: ${error}`
			});
		}
	}
}