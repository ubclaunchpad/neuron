import { Request, Response } from "express";
import VolunteerModel from "../models/volunteerModel.js";

const volunteerModel = new VolunteerModel();

async function getVolunteerById(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    try {
        const volunteer = await volunteerModel.getVolunteerById(volunteer_id);
        res.status(200).json(volunteer);
    } catch (error: any) {
        return res.status(error.status ?? 500).json({
			error: error.message
		});
    }
}

async function getVolunteers(req: Request, res: Response) {
    try {
        const volunteers = await volunteerModel.getVolunteers();
        res.status(200).json(volunteers);
    } catch (error: any) {
        return res.status(error.status ?? 500).json({
			error: error.message
		});
    }
}

// Update a volunteer's profile based on the volunteer_id
async function updateVolunteer(req: Request, res: Response) {
    const { volunteer_id } = req.params;
    const volunteerData = req.body;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    try {
        const updatedVolunteer = await volunteerModel.updateVolunteer(
            volunteer_id,
            volunteerData
        );
        res.status(200).json(updatedVolunteer);
    } catch (error: any) {
        return res.status(error.status ?? 500).json({
			error: error.message
		});
    }
}

// Update a volunteer's profile based on the volunteer_id
async function shiftCheckIn(req: Request, res: Response) {
    const fk_volunteer_id = req.body.volunteerID;
    const fk_schedule_id = req.body.scheduleID;
    const shift_date = req.body.shiftDate;

    if (!fk_volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameters: 'volunteer_id'"
        });
    }

    if (!fk_schedule_id) {
        return res.status(400).json({
            error: "Missing required parameters: 'fk_schedule_id'"
        });
    }

    if (!shift_date) {
        return res.status(400).json({
            error: "Missing required parameters: 'shift_date'"
        });
    }

    try {
        const updatedVolunteer = await volunteerModel.shiftCheckIn(fk_volunteer_id, fk_schedule_id, shift_date);
        res.status(200).json(updatedVolunteer);
    } catch (error: any) {
        return res.status(error.status ?? 500).json({
			error: error.message
		});
    }
}

async function getPreferredClassesById(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'user_id'",
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

export {
    getVolunteerById,
    getVolunteers, 
    shiftCheckIn, 
    updateVolunteer,
    getPreferredClassesById
};

