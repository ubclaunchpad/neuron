import { Request, Response } from 'express';
import { ClassDB } from '../common/generated.js';
import ClassesModel from '../models/classModel.js';

const classesModel = new ClassesModel();

async function getAllClasses(req: Request, res: Response) {
	const classes = await classesModel.getClasses();

	res.status(200).json(classes);
}

async function addClass(req: Request, res: Response) {
	const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory } = req.body;

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
}

async function updateClass(req: Request, res: Response) {
	const class_id = Number(req.params.class_id);

	const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date, category, subcategory } = req.body;

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
}

async function deleteClass(req: Request, res: Response) {
	const class_id = Number(req.params.class_id);

	const result = await classesModel.deleteClass(class_id);

	return res.status(200).json(result);
}

async function getClassesByDay(req: Request, res: Response) {
	const { day } = req.params;

	const classes = await classesModel.getClassesByDay(day);

	res.status(200).json(classes);
}

// get class info for a specific shift ID
async function getClassById(req: Request, res: Response) {
	const class_id = Number(req.params.class_id);

	const class_info = await classesModel.getClassById(class_id);

	res.status(200).json(class_info);
}

async function uploadClassImage(req: Request, res: Response) {
	const class_id = Number(req.params.class_id);
	const image = req.file!.buffer;

	const imageId = await classesModel.upsertClassImage(class_id, image);

	return res.status(201).json({
		message: 'Image uploaded successfully',
		data: imageId
	});
}

export {
	addClass, deleteClass, getAllClasses, getClassById,
	getClassesByDay, updateClass, uploadClassImage
};

