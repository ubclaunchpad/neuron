import { Response } from 'express';
import { ShiftDB } from '../common/generated.js';
import { AuthenticatedRequest } from '../common/types.js';
import ShiftModel from '../models/shiftModel.js';

const shiftModel = new ShiftModel();

async function getShiftInfo(req: AuthenticatedRequest, res: Response){
    const shift: ShiftDB = req.body;
    
    const shift_info = await shiftModel.getShiftInfo(shift.fk_volunteer_id, shift.fk_schedule_id, shift.shift_date);
    
    res.status(200).json(shift_info);
}

// get all the shifts assigned to a volunteer, using the volunteer's ID
async function getShiftsByVolunteerId(req: AuthenticatedRequest, res: Response) {
    const { volunteer_id } = req.params;

    const shifts = await shiftModel.getShiftsByVolunteerId(volunteer_id);

    res.status(200).json(shifts);
} 

// get all the shifts on a given date
async function getShiftsByDate(req: AuthenticatedRequest, res: Response) {
    const shift: ShiftDB = req.body;

    const shifts = await shiftModel.getShiftsByDate(shift.shift_date);

    res.status(200).json(shifts);
}

// get all the shifts viewable for a volunteer for the month around a given date
async function getShiftsByVolunteerIdAndMonth(req: AuthenticatedRequest, res: Response) {
    const shift: ShiftDB = req.body;

    const date = new Date(shift.shift_date + 'T00:00:00'); // Adding time to avoid timezone issues
    const month: number = new Date(date).getMonth() + 1;
    const year: number = new Date(shift.shift_date).getFullYear();

    const shifts = await shiftModel.getShiftsByVolunteerIdAndMonth(shift.fk_volunteer_id, month, year);
        
    res.status(200).json(shifts);
}

// volunteer requesting to cover someone else’s open shift
async function requestToCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.body;

    const request = await shiftModel.requestToCoverShift(request_id, volunteer_id);

    res.status(200).json(request);
}

async function addShift(req: AuthenticatedRequest, res: Response) {
    const shift: ShiftDB = req.body;

    const request = await shiftModel.addShift(shift);
    const addedShift = {
        shift_id: request.insertId,
        fk_volunteer_id: shift.fk_volunteer_id ?? null,
        fk_schedule_id: shift.fk_schedule_id,
        shift_date: shift.shift_date,
        duration: shift.duration,
        checked_in: shift.checked_in
    };

    res.status(200).json(addedShift);
}

async function updateShift(req: AuthenticatedRequest, res: Response) {
    const shift_id = Number(req.params.shift_id);
    const shift: ShiftDB = req.body;

    const request = await shiftModel.updateShift(shift_id, shift);

    res.status(200).json(request);
}

async function deleteShift(req: AuthenticatedRequest, res: Response) {
    const shift_id = Number(req.params.shift_id);

    const request = await shiftModel.deleteShift(shift_id);

    res.status(200).json(request);
}

export {
    addShift, deleteShift, getShiftInfo, getShiftsByDate, getShiftsByVolunteerId, getShiftsByVolunteerIdAndMonth,
    requestToCoverShift, updateShift
};

