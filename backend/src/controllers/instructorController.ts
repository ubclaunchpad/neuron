import { Request, Response } from 'express';
import InstructorModel from '../models/instructor.js';

export default class instructorController {

    async getInstructors(req: Request, res: Response){
        const instructorModel = new InstructorModel();
        
        try {
            const instructors = await instructorModel.getInstructors();
            res.status(200).json(instructors);
        } catch (error) {
         return res.status(500).json({
             error: `Internal server error: ${error}`
         });
        }
     };

     async getInstructorById(req: Request, res: Response) {
        const instructorModel = new InstructorModel();

        const { instructor_id } = req.params;
        
        if (!instructor_id) {
            return res.status(400).json({
                error: "Missing required parameter: 'instructor_id'"
            });
        }
    
        try {
            const instructor = await instructorModel.getInstructorById(instructor_id);
            res.status(200).json(instructor);
        } catch (error) {
            return res.status(500).json({
                error: `Internal server error. ${error}`
            });
        };
    }
}