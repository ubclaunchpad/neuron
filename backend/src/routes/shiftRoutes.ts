import express from 'express';
import { Request, Response } from 'express';
import ShiftController from '../controllers/shiftController.js';

const router = express.Router();
const shiftController = new ShiftController();

router.post('/', async (req: Request, res: Response) => { 

     await shiftController.getShiftInfo(req, res); 
 });

export default router;