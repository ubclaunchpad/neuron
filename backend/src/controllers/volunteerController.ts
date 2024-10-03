import { Request, Response } from 'express';
import VolunteerModel from '../models/volunteerModel.js';

const volunteerModel = new VolunteerModel();

async function getVolunteerByEmail(req: Request, res: Response) {
    const { volunteerEmail } = req.body;

    if (!volunteerEmail) {
        return res.status(400).json({
            error: "Missing required field: 'volunteerEmail'"
        });
    }

    try {
        const volunteer = await volunteerModel.getVolunteerByEmail(volunteerEmail);
        res.status(200).json(volunteer);
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

async function getVolunteers(req: Request, res: Response) {
    try {
        const volunteers = await volunteerModel.getVolunteers();
        res.status(200).json(volunteers);
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

// Update a volunteer's profile based on the volunteer_id
async function updateVolunteer(req: Request, res: Response) {
    const { volunteer_id } = req.params;
    const volunteerData = req.body;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'"
        });
    }

    try {
        const updatedVolunteer = await volunteerModel.updateVolunteer(volunteer_id, volunteerData);
        res.status(200).json(updatedVolunteer);
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

export { 
    getVolunteerByEmail, 
    getVolunteers ,
    updateVolunteer
};
