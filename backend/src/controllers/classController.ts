import { Response } from 'express';
import { ClassDB } from '../common/databaseModels.js';
import { AuthenticatedRequest } from '../common/types.js';
import ClassesModel from '../models/classModel.js';

const classesModel = new ClassesModel();

async function getAllClasses(req: AuthenticatedRequest, res: Response) {
	const classes = await classesModel.getClasses();

	res.status(200).json(classes);
}

async function addClass(req: AuthenticatedRequest, res: Response) {
	const newClass: ClassDB = req.body;
	const schedules = req.body.schedules;

	const result = await classesModel.addClass(newClass, schedules);

	res.status(200).json(result);
}

async function updateClass(req: AuthenticatedRequest, res: Response) {
	const class_id = Number(req.params.class_id);
	const partialClass: Partial<ClassDB> = req.body;

	const result = await classesModel.updateClass(class_id, partialClass);
	
	return res.status(200).json(result);
}

async function deleteClass(req: AuthenticatedRequest, res: Response) {
	const class_id = Number(req.params.class_id);

	const result = await classesModel.deleteClass(class_id);

	return res.status(200).json(result);
}

async function getClassesByDay(req: AuthenticatedRequest, res: Response) {
	const { day } = req.params;

	const classes = await classesModel.getClassesByDay(day);

	res.status(200).json(classes);
}

// get class info for a specific shift ID
async function getClassById(req: AuthenticatedRequest, res: Response) {
	const class_id = Number(req.params.class_id);

	const class_info = await classesModel.getClassById(class_id);

	res.status(200).json(class_info);
}

async function uploadClassImage(req: AuthenticatedRequest, res: Response) {
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

