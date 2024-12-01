import { Request, Response } from "express";
import VolunteerModel from "../models/volunteerModel.js";
import { ProfilePic } from "../common/interfaces.js";

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
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error. ${error}`,
        });
    }
}

async function getVolunteerByUserId(user_id: string): Promise<any> {
    return new Promise((resolve, reject) => {
        volunteerModel
            .getVolunteerByUserId(user_id)
            .then((results: any) => {
                resolve(results);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

async function getVolunteers(req: Request, res: Response) {
    try {
        const volunteers = await volunteerModel.getVolunteers();
        res.status(200).json(volunteers);
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error. ${error}`,
        });
    }
}

// Insert a new volunteer into the database
async function insertVolunteer(volunteer: any): Promise<any> {
    return new Promise((resolve, reject) => {
        volunteerModel
            .insertVolunteer(volunteer)
            .then((results: any) => {
                resolve(results);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
}

// Delete a volunteer from the database based on the user_id
async function deleteVolunteer(user_id: string): Promise<any> {
    return new Promise((resolve, reject) => {
        volunteerModel
            .deleteVolunteer(user_id)
            .then((results: any) => {
                resolve(results);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
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
        return res.status(error.status).json({
            error: error.message,
        });
    }
}

async function insertProfilePicture(req: Request, res: Response) {
    const { volunteer_id } = req.body;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required fields. 'volunteer_id' is required."
        });
    }

    if (!req.file) {
        return res.status(400).json({
            error: "Missing required profile picture file."
        });
    }

    const imageBuffer = req.file.buffer;
    const profilePic: ProfilePic = {
        volunteer_id: volunteer_id,
        profile_picture: imageBuffer
    }
    try {
        const insertedProfilePic = await volunteerModel.insertProfilePicture(profilePic);
        res.status(200).json(insertedProfilePic);
    } catch (error: any) {
        return res.status(error.status).json({
            error: error.message,
        });
    }
}

async function getProfilePicture(req: Request, res: Response) {
    const { volunteer_id } = req.params;
    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    try {
        const profilePic = await volunteerModel.getProfilePicture(volunteer_id);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(profilePic, 'binary');
    } catch (error: any) {
        return res.status(error.status).json({
            error: error.message,
        });
    }
}

async function updateProfilePicture(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    if (!req.file) {
        return res.status(400).json({
            error: "Missing required profile picture file."
        });
    }

    const imageBuffer = req.file.buffer;
    const profilePic: ProfilePic = {
        volunteer_id: volunteer_id,
        profile_picture: imageBuffer
    }
    try {
        const result = await volunteerModel.updateProfilePicture(profilePic);
        res.status(200).json(result);
    } catch (error: any) {
        return res.status(error.status).json({
            error: error.message,
        });
    }
}

async function deleteProfilePicture(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    try {
        const result = await volunteerModel.deleteProfilePicture(volunteer_id);
        res.status(200).json(result);
    } catch (error: any) {
        return res.status(error.status).json({
            error: error.message,
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
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error. ${error}`
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
    } catch (error) {
        return res.status(500).json({
            error: `Internal server error. ${error}`
        });
    }
}

export {
    getVolunteerById,
    getVolunteerByUserId,
    getVolunteers,
    insertVolunteer,
    deleteVolunteer,
    updateVolunteer,
    insertProfilePicture,
    getProfilePicture,
    updateProfilePicture,
    deleteProfilePicture,
    shiftCheckIn
};
