import { Request, Response } from 'express';
import ShiftModel from '../models/shiftModel.js';
import { Shift } from '../common/interfaces.js';

const shiftModel = new ShiftModel();

// regular expression to match the SQL DATE format: YYYY-MM-DD
const sqlDateRegex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

async function getShiftInfo(req: Request, res: Response){
    const shift: Shift = req.body;

    if (!shift.fk_volunteer_id || !shift.fk_schedule_id || !shift.shift_date) {
        return res.status(400).json({
            error: "Missing required fields. 'fk_volunteer_id', 'fk_schedule_id' and 'shift_date' are required."
        });
    }

    // check if the input matches the regex
    if (!sqlDateRegex.test(shift.shift_date)) {
        return res.status(400).json({
            error: "'shiftDate' must be a valid date of the format 'YYYY-MM-DD'"
        });
    }
    
    try {
        const shift_info = await shiftModel.getShiftInfoFromDB(shift.fk_volunteer_id, shift.fk_schedule_id, shift.shift_date);
        res.status(200).json(shift_info[0]);
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    }
}

// get all the shifts assigned to a volunteer, using the volunteer's ID
async function getShiftsByVolunteerId(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'"
        });
    }

    try {
        const shifts = await shiftModel.getShiftsByVolunteerId(volunteer_id);
        res.status(200).json(shifts);
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error. ${error.message}`
        });
    }
} 

// get all the shifts on a given date
async function getShiftsByDate(req: Request, res: Response) {
    const shift: Shift = req.body;

    if (!shift.shift_date) {
        return res.status(400).json({
            error: "Missing required field: 'shift_date'"
        });
    }

    // check if the input matches the regex
    if (!sqlDateRegex.test(shift.shift_date)) {
        return res.status(400).json({
            error: "'shiftDate' must be a valid date of the format 'YYYY-MM-DD'"
        });
    }

    try {
        const shifts = await shiftModel.getShiftsByDate(shift.shift_date);
        res.status(200).json(shifts);
    } catch (error: any) {
        return res.status(500).json({
            error: `Internal server error. ${error.message}`
        });
    }
}

export {
    getShiftInfo,
    getShiftsByVolunteerId,
    getShiftsByDate
};