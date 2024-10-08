import { Router, Request, Response } from 'express';
import InstructorController from '../controllers/instructorController.js';

const router = Router();
const instructorController = new InstructorController();

// get all instructors
router.get('/', async (req: Request, res: Response) => { 
    await instructorController.getInstructors(req, res) 
});

export default router;