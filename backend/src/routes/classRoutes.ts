import express from 'express';
import { Request, Response } from 'express';
import {getAllClasses, getClassById} from '../controllers/classController.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => { 
    await getAllClasses(req, res); 
});


router.get('/:class_id', async (req: Request, res: Response) => { 
    await getClassById(req, res); 
});

export default router;