import { Request, Response } from 'express';
import VolunteerModel from '../models/volunteerModel.js';

const volunteerModel = new VolunteerModel();

async function getVolunteerById(req: Request, res: Response) {
    const volunteerId = req.params.id;
    try {
        const volunteer = await volunteerModel.getVolunteerById(volunteerId);
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

export { 
    getVolunteerById,
    getVolunteers
};
