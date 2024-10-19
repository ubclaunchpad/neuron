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

// get all the shifts on a given date
async function getShiftsByDate(req: Request, res: Response) {
    const { date } = req.body;

    if (!date) {
        return res.status(400).json({
            error: "Missing required property in request body: 'date'"
        });
    }

    // regular expression to match the SQL DATE format: YYYY-MM-DD
    const sqlDateRegex = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    // check if the input matches the regex
    if (!sqlDateRegex.test(date)) {
        return res.status(400).json({
            error: "'date' must be an valid date of the format 'YYYY-MM-DD'"
        });
    }

    try {
        const shifts = await shiftModel.getShiftsByDate(date);
        res.status(200).json(shifts);
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error. ${error}`
        });
    }

}

export {
    getShiftsByVolunteerId,
    getShiftsByDate
};