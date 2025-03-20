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
    const { email, f_name, l_name, signoff } = req.body;

    const result = await instructorModel.insertInstructor({
        instructor_id: uuidv4(),
        email,
        f_name,
        l_name
    } as InstructorDB, signoff);

    res.status(200).json(result);
}

async function deleteInstructor(req: AuthenticatedRequest, res: Response) {
    const { instructor_id } = req.params;
    const { signoff } = req.body;

    const result = await instructorModel.deleteInstructor(instructor_id, signoff);

    res.status(200).json(result);
}

async function editInstructor(req: AuthenticatedRequest, res: Response) {
    const { instructor_id } = req.params;
    const { email, f_name, l_name, signoff } = req.body;

    const result = await instructorModel.editInstructor(instructor_id, {
        email,
        f_name,
        l_name
    } as InstructorDB, signoff);

    res.status(200).json(result);
}

export { deleteInstructor, editInstructor, getInstructorById, getInstructors, insertInstructor };

