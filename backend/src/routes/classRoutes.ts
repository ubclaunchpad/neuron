import express from 'express';
import { Request, Response } from 'express';
import ClassesController from '../controllers/classController.js';

const router = express.Router();
const classController = new ClassesController();

router.get('/', async (req: Request, res: Response) => { 
     await classController.getAllClasses(req, res); 
 });

router.post('/', async (req: Request, res: Response) => {
    await classController.addClass(req, res);
});


export default router;