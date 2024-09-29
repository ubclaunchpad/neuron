import { Request, Response } from 'express';
import Instructor from '../models/instructor.js';

function getInstructors(req: Request, res: Response){
   const instructorModel = new Instructor();
   
   try {
       const instructors = instructorModel.getInstructors();
       res.status(200).json(instructors);
   } catch (error) {
       return res.status(500).json({
           error: "Internal server error"
       });
   }
}

export { getInstructors };