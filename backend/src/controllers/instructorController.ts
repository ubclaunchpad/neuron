import { Request, Response } from 'express';
import { Instructor } from '../common/generated.js';
import InstructorModel from '../models/instructorModel.js';

const instructorModel = new InstructorModel();

async function getInstructors(req: Request, res: Response) {
    try {
        const instructors = await instructorModel.getInstructors();
        res.status(200).json(instructors);
    } catch (error: any) {
        return res.status(error.status).json({
            error: `${error.message}`
        });
    }
}

async function getInstructorById(req: Request, res: Response) {
    const { instructor_id } = req.params;

    if (!instructor_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'instructor_id'"
        });
    }

    try {
        const instructor = await instructorModel.getInstructorById(instructor_id);
        res.status(200).json(instructor);
    } catch (error: any) {
        return res.status(error.status).json({
            error: `${error.message}`
        });
    };
}

async function insertInstructor(req: Request, res: Response) {
    const instructor: Instructor = req.body;

    const { instructor_id, f_name, l_name, email } = instructor;
    if (!instructor_id || !f_name || !l_name || !email) {
        return res.status(400).json({
            error: "Missing required fields. 'instructor_id', 'f_name', 'l_name', and 'email' are required."
        });
    }

    try {
        const result = await instructorModel.insertInstructor(instructor);
        res.status(200).json(result);
    } catch (error: any) {
        return res.status(error.status).json({
            error: `${error.message}`
        });
    }
}

export {
    getInstructorById, getInstructors, insertInstructor
};
