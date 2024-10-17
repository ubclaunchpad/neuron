import { Router, Request, Response } from 'express';
import { 
    getInstructors, 
    getInstructorById,
    insertInstructor
} from '../controllers/instructorController.js';

const router = Router();

// get all instructors
router.get('/', async (req: Request, res: Response) => { 
    await getInstructors(req, res) 
});

// get instructor by ID
router.get('/:instructor_id', async (req: Request, res: Response) => { 
    await getInstructorById(req, res) 
});

// insert a new instructor
router.post('/', async (req: Request, res: Response) => {
    await insertInstructor(req, res);
});

export default router;