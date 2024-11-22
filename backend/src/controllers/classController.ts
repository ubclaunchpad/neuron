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
		const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category } = req.body;

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
				end_date: end_date,
				category: category,
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
				end_date,
				category,
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

	public async getAllImages(req: Request, res: Response) {
		try {
			const images = await this.classesModel.getAllImages();
			return res.status(200).json({
				data: images
			});
		} catch (error) {
			return res.status(500).json({
				error: `Internal server error: ${error}`
			});
		}
	}

	public async getImageByClassId(req: Request, res: Response) {
		const class_id = Number(req.params.class_id);

		if (!class_id) {
			return res.status(400).json({
				error: 'Missing required field: class_id'
			});
		}

		try {
			const image = await this.classesModel.getImageByClassId(class_id);
			return res.status(200).json({
				data: image
			});
		} catch (error) {
			return res.status(500).json({
				error: `Internal server error: ${error}`
			});
		};
	}

	public async uploadImage(req: Request, res: Response) {

		const class_id = Number(req.params.class_id);

		if (!req.file) {
			return res.status(400).json({
				error: 'No image uploaded'
			});
		}

		if (!class_id) {
			return res.status(400).json({
				error: 'Missing required field: class_id'
			});
		}

		const image = req.file.buffer;

		const result = await this.classesModel.uploadImage(class_id, image);
		return res.status(201).json({
			message: 'Image uploaded successfully',
			data: result
		});
	}
}