import { Request, Response } from 'express';
import ClassesModel from '../models/classModel.js';

const classModel = new ClassesModel();


async function getAllClasses(req: Request, res: Response){	
	try {
		const classes = await classModel.getClassesFromDB();
		res.status(200).json(classes);
	} catch (error) {
		return res.status(500).json({
			error: `Internal server error: ${error}`
		});
	}
}

// get class info for a specific shift ID
async function getClassById(req: Request, res: Response) {
	const { class_id } = req.params;
	
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
		   return res.status(error.status).json({
			 error: `${error.message}`
		   });
	};
}

export {
	getAllClasses, 
	getClassById
};