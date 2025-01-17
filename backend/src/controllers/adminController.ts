import { Response } from "express";
import VolunteerModel from "../models/volunteerModel.js";

import { Volunteer } from "../common/generated.js";
import { AuthenticatedUserRequest } from "../common/types.js";

const volunteerModel = new VolunteerModel();

async function getUnverifiedVolunteers(
    req: AuthenticatedUserRequest,
    res: Response
) {
    try {
        const unverifiedVolunteers =
            await volunteerModel.getUnverifiedVolunteers();
        res.status(200).json({
            volunteers: unverifiedVolunteers,
        });
    } catch (error: any) {
		return res.status(500).json({
			error: `${error.message}`
		});
	}
}

async function verifyVolunteer(
    req: AuthenticatedUserRequest,
    res: Response
): Promise<any> {
    // Get the token from the request parameters
    const volunteer_id = req.body.volunteer_id;

    // If the token is not provided, return an error
    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    // Update the user's active status
    try {
        await volunteerModel.updateVolunteer(volunteer_id, {
            active: true,
        } as Volunteer);

        return res.status(200).json({
            message: "User verified successfully",
        });
    } catch (error: any) {
		return res.status(500).json({
			error: `${error.message}`
		});
	}
}

export { getUnverifiedVolunteers, verifyVolunteer };
