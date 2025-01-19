import { Request, Response } from 'express';
import { ClassDB } from '../common/generated.js';
import ClassesModel from '../models/classModel.js';

const classesModel = new ClassesModel();

async function getAllClasses(req: Request, res: Response) {
	try {
		const classes = await classesModel.getClasses();
		res.status(200).json(classes);
	} catch (error: any) {
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	}
}

async function addClass(req: Request, res: Response) {
	const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory } = req.body;

	if (!fk_instructor_id || !class_name || !start_date || !end_date) {
		return res.status(400).json({
			error: 'Missing required fields: fk_instructor_id, class_name, start_date, and end_date are required.'
		});
	}

	try {
		const newClass = {
			fk_instructor_id,
			class_name,
			instructions: instructions,
			zoom_link: zoom_link,
			start_date: start_date,
			end_date: end_date,
			category: category,
			subcategory: subcategory
		} as ClassDB;

		const result = await classesModel.addClass(newClass);
		const newClassId = result.insertId;
		const addedClass = {
			class_id: newClassId,
			fk_instructor_id,
			class_name,
			instructions,
			zoom_link,
			start_date,
			end_date,
			category,
			subcategory
		};

		return res.status(201).json({
			message: 'Class added successfully',
			data: addedClass
		});
	} catch (error: any) {
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	}
}

async function updateClass(req: Request, res: Response) {
	const { class_id } = req.params;
	const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory } = req.body;

	if (!class_id) {
		return res.status(400).json({
			error: 'Missing required field: class_id is required.'
		});
	}

	if (!fk_instructor_id || !class_name || !start_date || !end_date) {
		return res.status(400).json({
			error: 'Missing required fields: fk_instructor_id, class_name, start_date, and end_date are required.'
		});
	}

	try {
		const updatedClass = {
			fk_instructor_id,
			class_name,
			instructions: instructions,
			zoom_link: zoom_link,
			start_date: start_date,
			end_date: end_date,
			category: category,
			subcategory: subcategory
		} as ClassDB;

		const result = await classesModel.updateClass(class_id, updatedClass);
		return res.status(200).json(result);
	} catch (error: any) {
		return res.status(error.status).json({
            error: error.message,
        });
	}
}

async function deleteClass(req: Request, res: Response) {
	const { class_id } = req.params;

	if (!class_id) {
		return res.status(400).json({
			error: 'Missing required field: class_id is required.'
		});
	}

	try {
		const result = await classesModel.deleteClass(class_id);
		return res.status(200).json(result);
	} catch (error: any) {
		return res.status(error.status).json({
            error: error.message,
        });
	}
}

async function getClassesByDay(req: Request, res: Response) {
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
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	}
}

// get class info for a specific shift ID
async function getClassById(req: Request, res: Response) {
	const class_id = Number(req.params.class_id);

	if (!class_id) {
		return res.status(400).json({
			error: "Missing required parameter: 'class_id'"
		});
	}

	try {
		const classesModel = new ClassesModel();
		const class_info = await classesModel.getClassById(class_id);
		res.status(200).json(class_info);
	} catch (error: any) {
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	};
}

async function uploadClassImage(req: Request, res: Response) {
	const class_id = Number(req.params.class_id);

	if (!class_id) {
		return res.status(400).json({
			error: 'Missing required field: class_id'
		});
	}

	if (!req.file) {
		return res.status(400).json({
			error: 'No image uploaded'
		});
	}

	const image = req.file.buffer;

	try	{
		const imageId = await classesModel.upsertClassImage(class_id, image);
	
		return res.status(201).json({
			message: 'Image uploaded successfully',
			data: imageId
		});
	} catch (error: any) {
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	};
}

export {
	addClass, getAllClasses, getClassById,
	getClassesByDay, uploadClassImage
};

