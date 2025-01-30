import { Request, Response } from 'express';
import { InstructorDB } from '../common/generated.js';
import InstructorModel from '../models/instructorModel.js';

const instructorModel = new InstructorModel();

async function getInstructors(req: Request, res: Response) {
    const instructors = await instructorModel.getInstructors();

    res.status(200).json(instructors);
}

async function getInstructorById(req: Request, res: Response) {
    const { instructor_id } = req.params;

    const instructor = await instructorModel.getInstructorById(instructor_id);
    
    res.status(200).json(instructor);
}

async function insertInstructor(req: Request, res: Response) {
    const instructor: InstructorDB = req.body;

    const result = await instructorModel.insertInstructor(instructor);

    res.status(200).json(result);
}

export {
    getInstructorById, getInstructors, insertInstructor
};
