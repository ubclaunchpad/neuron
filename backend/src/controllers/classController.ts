import { Request, Response } from 'express';
import ClassesModel from '../models/classModel.js';
import { Class } from '../common/interfaces.js'

export default class ClassesController {

	private classesModel = new ClassesModel();
	public async getAllClasses(req: Request, res: Response) {
		try {
			const classes = await this.classesModel.getClasses();
			res.status(200).json(classes);
		} catch (error) {
			return res.status(500).json({
				error: `Internal server error: ${error}`
			});
		}
	}

	public async addClass(req: Request, res: Response) {
		const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date } = req.body;

		if (!fk_instructor_id || !class_name || !start_date || !end_date) {
			return res.status(400).json({
				error: 'Missing required fields: fk_instructor_id, class_name, start_date, and end_date are required.'
			});
		}

		try {
			const newClass: Class = {
				fk_instructor_id,
				class_name,
				instructions: instructions,
				zoom_link: zoom_link,
				start_date: start_date,
				end_date: end_date
			};

			const result = await this.classesModel.addClass(newClass);
			const newClassId = result.class_id;
			const addedClass = {
				class_id: newClassId,
				fk_instructor_id,
				class_name,
				instructions,
				zoom_link,
				start_date,
				end_date
			};

			return res.status(201).json({
				message: 'Class added successfully',
				data: addedClass
			});
		} catch (error) {
			return res.status(500).json({
				error: `Internal server error: ${error}`
			});
		}
	}

  public async getClassesByDay(req: Request, res: Response) {
    const day = req.params.day;
    const classModel = new ClassesModel();
    if (!day) {
      return res.status(400).json({
        error: "Missing required parameter: 'day'",
      });
    }
    const regex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
    if (!regex.test(day)) {
      return res.status(400).json({
        error: "Invalid day format. Please use YYYY-MM-DD.",
      });
    }
    try {
      const classes = await classModel.getClassesByDay(day);
      res.status(200).json(classes);
    } catch (error: any) {
      return res.status(error.status).json({
        error: error.message,
      });
    }
  }
}
