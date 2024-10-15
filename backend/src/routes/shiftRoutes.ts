import express from 'express';
import { Request, Response } from 'express';
import ShiftController from '../controllers/shiftController.js';

const router = express.Router();
const shiftController = new ShiftController();

router.post('/', async (req: Request, res: Response) => { 

     const fk_volunteer_id = req.body.volunteerID; 
     const fk_schedule_id = req.body.scheduleID;
     const shift_date = req.body.shiftDate;

     await shiftController.getShiftInfo(req, res, fk_volunteer_id, fk_schedule_id, shift_date); 
 });

export default router;