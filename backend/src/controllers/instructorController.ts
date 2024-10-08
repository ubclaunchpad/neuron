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
     }
}