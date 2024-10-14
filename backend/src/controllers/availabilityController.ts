import { Request, Response } from 'express';
import AvailabilityModel from '../models/availabilityModel.js';
import { Availability } from '../common/types.js';

const availabilityModel = new AvailabilityModel();

async function getAvailabilities(req: Request, res: Response) {
    // console.log("DEBUG: getAvailabilities");

    try {
        const availabilities = await availabilityModel.getAvailabilities();
        res.status(200).json(availabilities);
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error}`
        });
    }
}

async function getAvailabilityByVolunteerId(req: Request, res: Response) {
    // console.log("DEBUG: getAvailabilityByVolunteerId");

    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'"
        });
    }

    try {
        const availability = await availabilityModel.getAvailabilityByVolunteerId(volunteer_id);
        res.status(200).json(availability);
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error}`
        });
    }
}

function isValidAvailabilities(data: any): data is Availability[] {
    return Array.isArray(data) && data.every((availability) => {
        return (
            // Validate its day is a number between 1 and 7
            typeof availability.day === "number" &&
            (availability.day >= 1 && availability.day <= 7) &&

            // Validate its start_time is a string between 00:00 and 23:59
            typeof availability.start_time === "string" &&
            availability.start_time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) &&

            // Validate its end_time is a string between 00:00 and 23:59
            typeof availability.end_time === "string" &&
            availability.end_time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)

            // TODO: May need to validate start_time < end_time
        )
    });
}

async function setAvailabilityByVolunteerId(req: Request, res: Response) {
    // console.log("DEBUG: setAvailabilityByVolunteerId");

    const { volunteer_id } = req.params;
    const availabilities: Availability[] = req.body;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'"
        });
    }

    if (!isValidAvailabilities(availabilities)) {
        return res.status(400).json({
            error: "Invalid availability data"
        });
    }

    try {
        const result = await availabilityModel.setAvailabilityByVolunteerId(volunteer_id, availabilities);
        res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error: ${error}`
        })
    }
}


export {
    getAvailabilities,
    getAvailabilityByVolunteerId,
    setAvailabilityByVolunteerId
};