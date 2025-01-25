import { Request, Response } from "express";
import VolunteerModel from "../models/volunteerModel.js";

const volunteerModel = new VolunteerModel();

async function getVolunteerById(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    const volunteer = await volunteerModel.getVolunteerById(volunteer_id);

    res.status(200).json(volunteer);
}

async function getVolunteers(req: Request, res: Response) {
    const volunteers = await volunteerModel.getVolunteers();

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

export {
    getVolunteerById,
    getVolunteers, shiftCheckIn, updateVolunteer
};

