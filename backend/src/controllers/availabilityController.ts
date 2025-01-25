import { Request, Response } from 'express';
import { AvailabilityDB } from '../common/generated.js';
import AvailabilityModel from '../models/availabilityModel.js';

const availabilityModel = new AvailabilityModel();

async function getAvailabilities(req: Request, res: Response) {
    try {
        const availabilities = await availabilityModel.getAvailabilities();
        res.status(200).json(availabilities);
    } catch (error: any) {
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	}
}

async function getAvailabilityByVolunteerId(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'"
        });
    }

    try {
        const availability = await availabilityModel.getAvailabilityByVolunteerId(volunteer_id);
        res.status(200).json(availability);
    } catch (error: any) {
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	}
}

function isValidAvailabilities(data: any): data is AvailabilityDB[] {
    return Array.isArray(data) && data.every((availability) => {
        return (
            // Validate its day is a number between 0 and 6
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
    const availabilities: AvailabilityDB[] = req.body;

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
    } catch (error: any) {
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	}
}

async function updateAvailabilityByVolunteerId(req: Request, res: Response) {
    // console.log("DEBUG: updateAvailabilityByVolunteerId");

    const { volunteer_id } = req.params;
    const availabilities: AvailabilityDB[] = req.body;

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
        const result = await availabilityModel.updateAvailabilityByVolunteerId(volunteer_id, availabilities);
        res.status(200).json(result);
    } catch (error: any) {
		return res.status(error.status ?? 500).json({
			error: error.message
		});
	}
}

export {
    getAvailabilities,
    getAvailabilityByVolunteerId,
    setAvailabilityByVolunteerId,
    updateAvailabilityByVolunteerId
};
