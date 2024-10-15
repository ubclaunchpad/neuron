import { Request, Response } from 'express';
import ShiftModel from '../models/shiftModel.js';

export default class ShiftController {

	public async getShiftInfo(req: Request, res: Response, fk_volunteer_id:string, fk_schedule_id:number, shift_date:string){
          
		const shiftModel = new ShiftModel();
		
		try {
			const shift_info = await shiftModel.getShiftInfoFromDB(fk_volunteer_id, fk_schedule_id, shift_date);
			res.status(200).json(shift_info[0]);
		} catch (error) {
			return res.status(500).json({
				error: `Internal server error: ${error}`
			});
		}
	}
}