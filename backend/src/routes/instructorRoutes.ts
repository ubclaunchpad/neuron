import { Router, Request, Response } from 'express';
import InstructorController from '../controllers/instructorController.js';

const router = Router();
const instructorController = new InstructorController();

// get all instructors
router.get('/', async (req: Request, res: Response) => { 
    await instructorController.getInstructors(req, res) 
});

router.get('/:instructor_id', async (req: Request, res: Response) => { 
    await instructorController.getInstructorById(req, res) 
});

export default router;