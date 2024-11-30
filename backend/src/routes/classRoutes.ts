import express from 'express';
import { Request, Response } from 'express';
import { getAllClasses, getClassById, getClassesByDay, addClass} from '../controllers/classController.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => { 
    await getAllClasses(req, res); 
});


router.get('/:class_id', async (req: Request, res: Response) => { 
    await getClassById(req, res); 
});

router.get("/schedule/:day", async (req, res) => {
  await getClassesByDay(req, res);
});

router.post('/', async (req: Request, res: Response) => {
    await addClass(req, res);
});


export default router;