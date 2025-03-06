import { Response } from 'express';
import { ShiftDB } from '../common/databaseModels.js';
import { ShiftQueryType, ShiftStatus } from '../common/interfaces.js';
import { AuthenticatedRequest } from '../common/types.js';
import { shiftModel, volunteerModel } from '../config/models.js';

async function getShift(req: AuthenticatedRequest, res: Response){
    const { shift_id } = req.body;

    const shift_info = await shiftModel.getShiftInfo(shift_id);

    res.status(200).json(shift_info);
}

// get all the shifts assigned to a volunteer, using the volunteer's ID
async function getShifts(req: AuthenticatedRequest, res: Response) {
    const { volunteer, before, after, type, status } = req.query as Record<string, string>;
    const volunteer_id = volunteer;

    if (req.user.role === 'volunteer') {
        const volunteer = await volunteerModel.getVolunteerByUserId(req.user.user_id);

        /* Cannot get shifts for other volunteer */
        if (volunteer.volunteer_id !== volunteer_id) {
            return res.status(403).json({
                error: "Unauthorized",
            });
        }
    }

    const shifts = await shiftModel.getShifts({
        volunteer_id: volunteer_id,
        before: before ? new Date(before) : undefined, 
        after: after ? new Date(after) : undefined,
        type: type as ShiftQueryType,
        status: status as ShiftStatus,
    });

    res.status(200).json(shifts);
}

// get all the shifts viewable for a volunteer for the month around a given date
async function getShiftsByVolunteerIdAndMonth(req: AuthenticatedRequest, res: Response) {
    const shift: ShiftDB = req.body;

    const date = new Date(shift.shift_date + 'T00:00:00'); // Adding time to avoid timezone issues
    const month: number = date.getMonth() + 1;
    const year: number = date.getFullYear();

    const shifts = await shiftModel.getShiftsByVolunteerIdAndMonth(shift.fk_volunteer_id, month, year);

    res.status(200).json(shifts);
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

async function deleteShift(req: AuthenticatedRequest, res: Response) {
    const shift_id = Number(req.params.shift_id);

    const request = await shiftModel.deleteShift(shift_id);

    res.status(200).json(request);
}

async function updateShift(req: AuthenticatedRequest, res: Response) {
    const shift_id = Number(req.params.shift_id);
    const shift: ShiftDB = req.body;

    const request = await shiftModel.updateShift(shift_id, shift);

    res.status(200).json(request);
}

// volunteer checks into a shift
async function checkInShift(req: AuthenticatedRequest, res: Response) {
    const shift_id = Number(req.params.shift_id);

    const request = await shiftModel.updateShiftCheckIn(shift_id);

    res.status(200).json(request);
}

// volunteer requesting to cover someone else’s open shift
async function requestCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.body;

    const request = await shiftModel.insertCoverageRequest(request_id, volunteer_id);

    res.status(200).json(request);
}

// volunteer cancels on covering a shift
async function withdrawCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.body;

    const request = await shiftModel.deleteCoverageRequest(request_id, volunteer_id);

    res.status(200).json(request);
}

// volunteer requests absence for their own shift
async function requestAbsence(req: AuthenticatedRequest, res: Response) {
    const { shift_id } = req.body; 

    const request = await shiftModel.insertAbsenceRequest(shift_id);

    res.status(200).json(request);
}

// volunteers cancels their request for shift absence
async function withdrawAbsenceRequest(req: AuthenticatedRequest, res: Response) {
    const { request_id, shift_id } = req.body;

    const request = await shiftModel.deleteAbsenceRequest(request_id, shift_id);

    res.status(200).json(request);
}

export {
    addShift, checkInShift, deleteShift, getShift, getShifts, getShiftsByVolunteerIdAndMonth, requestAbsence, requestCoverShift, updateShift, withdrawAbsenceRequest, withdrawCoverShift
};

