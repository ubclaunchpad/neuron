import { Request, Response } from "express";
import VolunteerModel from "../models/volunteerModel.js";
import UserModel from "../models/userModel.js";

const volunteerModel = new VolunteerModel();
const userModel = new UserModel();

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
    const users = await userModel.getAllVolunteerUsers();

    const finalData = volunteers.map((volunteer) => {
        const user = users.find((user) => user.user_id === volunteer.fk_user_id);
        // remove password from user object

        return {
            ...volunteer,
            image: user?.fk_image_id,
        };
    });

    res.status(200).json(finalData);
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

