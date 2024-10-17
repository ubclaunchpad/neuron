import { Request, Response } from 'express';
import ShiftModel from '../models/shiftModel.js';

export default class ShiftController {

	public async getShiftInfo(req: Request, res: Response){
		const shiftModel = new ShiftModel();
		
		try {
               const fk_volunteer_id = req.body.volunteerID; 
               const fk_schedule_id = req.body.scheduleID;
               const shift_date = req.body.shiftDate;
			const shift_info = await shiftModel.getShiftInfoFromDB(fk_volunteer_id, fk_schedule_id, shift_date);
			res.status(200).json(shift_info[0]);
		} catch (error) {
			return res.status(500).json({
				error: `An error occurred while executing the query: ${error}`
			});
		}
	}
}