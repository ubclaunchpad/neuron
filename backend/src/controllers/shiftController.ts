import { Request, Response } from "express";
import ShiftModel from "../models/shiftModel.js";

const shiftModel = new ShiftModel();

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
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error. ${error}`
        });
    }
} 

export {
    getShiftsByVolunteerId
};