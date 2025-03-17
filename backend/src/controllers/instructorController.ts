import { Response } from 'express';
import { v4 as uuidv4 } from "uuid";
import { InstructorDB } from '../common/databaseModels.js';
import { AuthenticatedRequest } from '../common/types.js';
import { instructorModel } from '../config/models.js';

async function getInstructors(req: AuthenticatedRequest, res: Response) {
    const instructors = await instructorModel.getInstructors();

    res.status(200).json(instructors);
}

async function getInstructorById(req: AuthenticatedRequest, res: Response) {
    const { instructor_id } = req.params;

    const instructor = await instructorModel.getInstructorById(instructor_id);
    
    res.status(200).json(instructor);
}

async function insertInstructor(req: AuthenticatedRequest, res: Response) {
    let instructor: InstructorDB = req.body;

    instructor.instructor_id = uuidv4();

    const result = await instructorModel.insertInstructor(instructor);

    res.status(200).json(result);
}

async function deleteInstructor(req: AuthenticatedRequest, res: Response) {
    const instructor_id = req.params.instructor_id;

    const result = await instructorModel.deleteInstructor(instructor_id);

    res.status(200).json(result);
}

async function editInstructor(req: AuthenticatedRequest, res: Response) {
    const instructor: InstructorDB = req.body;
    const instructor_id = req.params.instructor_id;

    const result = await instructorModel.editInstructor(instructor_id, instructor);

    res.status(200).json(result);
}

export { deleteInstructor, editInstructor, getInstructorById, getInstructors, insertInstructor };

