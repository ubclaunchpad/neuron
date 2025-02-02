import { Request, Response } from 'express';
import { ClassDB } from '../common/generated.js';
import ClassesModel from '../models/classModel.js';

const classesModel = new ClassesModel();

async function getAllClasses(req: Request, res: Response) {
	const classes = await classesModel.getClasses();

	res.status(200).json(classes);
}

async function addClass(req: Request, res: Response) {
	const newClass: ClassDB = req.body;
	const schedules = req.body.schedules;

	const result = await classesModel.addClass(newClass, schedules);

	res.status(200).json(result);
}

async function updateClass(req: Request, res: Response) {
	const class_id = Number(req.params.class_id);

	const {schedules, ...partialClass} = req.body;

	const result = await classesModel.updateClass(class_id, partialClass, schedules);
	
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

