import { Request, Response } from "express";
import VolunteerModel from "../models/volunteerModel.js";

const volunteerModel = new VolunteerModel();

async function getVolunteerById(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    const volunteers = await volunteerModel.getVolunteersByIds(volunteer_id);

    if (volunteers.length === 0) {
        throw {
            status: 400,
            message: `No volunteer found under the given ID`,
        };
    }

    res.status(200).json(volunteers[0]);
}

async function getVolunteers(req: Request, res: Response) {
    const volunteers = await volunteerModel.getAllVolunteers();

    res.status(200).json(volunteers);
}

// Update a volunteer's profile based on the volunteer_id
async function updateVolunteer(req: Request, res: Response) {
    const { volunteer_id } = req.params;
    const volunteerData = req.body;

    const updatedVolunteer = await volunteerModel.updateVolunteer(
        volunteer_id,
        volunteerData
    );

    res.status(200).json(updatedVolunteer);
}

// Update a volunteer's profile based on the volunteer_id
async function shiftCheckIn(req: Request, res: Response) {
    const { volunteerID, scheduleID, shiftDate } = req.body;

    const updatedVolunteer = await volunteerModel.shiftCheckIn(volunteerID, scheduleID, shiftDate);
    
    res.status(200).json(updatedVolunteer);
}

async function getPreferredClassesById(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    try {
        const preferred_classes = await volunteerModel.getPreferredClassesById(volunteer_id);

        res.status(200).json(preferred_classes);
    } catch (error: any) {
        return res.status(error.status ?? 500).json({
			error: error.message
		});
    }
}

async function updatePreferredClassesById (req: Request, res: Response) {
    const { volunteer_id } = req.params;
    const data = req.body;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    } else if (!data) {
        return res.status(400).json({
            error: "Missing required body for class preferences: 'data'",
        });
    }

    try {
        await volunteerModel.updatePreferredClassesById(volunteer_id, data);

        res.status(200).json({msg: "Successfully updated class Preferences"});
    } catch (error: any) {
        return res.status(error.status ?? 500).json({
			error: error.message
		});
    }
}

export {
    getVolunteerById,
    getVolunteers, 
    shiftCheckIn, 
    updateVolunteer,
    getPreferredClassesById,
    updatePreferredClassesById
};

