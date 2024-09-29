import { Router, Request, Response } from 'express';
import { getInstructors } from '../controllers/instructorController.js';

const router = Router();

// get all instructors
router.get('/getInstructors', (req: Request, res: Response) => { getInstructors(req, res) });

export default router;