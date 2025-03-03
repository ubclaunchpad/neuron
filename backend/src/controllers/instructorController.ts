import { Response } from 'express';
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
    const instructor: InstructorDB = req.body;

    const result = await instructorModel.insertInstructor(instructor);

    res.status(200).json(result);
}

export {
    getInstructorById, getInstructors, insertInstructor
};
