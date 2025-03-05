import { Response } from "express";
import { VolunteerDB } from "../common/databaseModels.js";
import { AuthenticatedRequest } from "../common/types.js";
import { volunteerModel } from "../config/models.js";


async function getUnverifiedVolunteers(
    req: AuthenticatedRequest,
    res: Response
) {
    const unverifiedVolunteers = await volunteerModel.getUnverifiedVolunteers();

    res.status(200).json({
        volunteers: unverifiedVolunteers,
    });
}

async function verifyVolunteer(
    req: AuthenticatedRequest,
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
