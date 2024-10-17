import { Router, Request, Response } from 'express';
import { 
    getInstructors, 
    getInstructorById
} from '../controllers/instructorController.js';

const router = Router();

// get all instructors
router.get('/', async (req: Request, res: Response) => { 
    await getInstructors(req, res) 
});

router.get('/:instructor_id', async (req: Request, res: Response) => { 
    await getInstructorById(req, res) 
});

export default router;