import { Response } from "express";
import VolunteerModel from "../models/volunteerModel.js";

import { VolunteerDB } from "../common/generated.js";
import { AuthenticatedUserRequest } from "../common/types.js";

const volunteerModel = new VolunteerModel();

async function getUnverifiedVolunteers(
    req: AuthenticatedUserRequest,
    res: Response
) {
    const unverifiedVolunteers = await volunteerModel.getUnverifiedVolunteers();

    res.status(200).json({
        volunteers: unverifiedVolunteers,
    });
}

async function verifyVolunteer(
    req: AuthenticatedUserRequest,
    res: Response
): Promise<any> {
    // Get the token from the request parameters
    const volunteer_id = req.body.volunteer_id;

    // Update the user's active status
    await volunteerModel.updateVolunteer(volunteer_id, {
        active: true,
    } as VolunteerDB);

    return res.status(200).json({
        message: "User verified successfully",
    });
}

export { getUnverifiedVolunteers, verifyVolunteer };
