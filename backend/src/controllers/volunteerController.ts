import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../common/types.js";
import { userModel, volunteerModel } from "../config/models.js";

async function getVolunteerById(req: AuthenticatedRequest, res: Response) {
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

async function getVolunteers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    let volunteers;
    if (req.query.unverified) {
        volunteers = await volunteerModel.getUnverifiedVolunteers();
    } else {
        volunteers = await volunteerModel.getAllVolunteers();
    }

    const volunteer_user_ids = volunteers.flatMap(v => v.fk_user_id ?? []);
    const users = await userModel.getUsersByIds(volunteer_user_ids);

    const finalData = volunteers.map((volunteer) => {
        const user = users.find((user: any) => user.user_id === volunteer.fk_user_id);
        return {
            ...volunteer,
            image: user?.fk_image_id,
        };
    });

    res.status(200).json(finalData);
}

// Update a volunteer's profile based on the volunteer_id
async function updateVolunteer(req: AuthenticatedRequest, res: Response) {
    const { volunteer_id } = req.params;
    const volunteerData = req.body;

    const updatedVolunteer = await volunteerModel.updateVolunteer(
        volunteer_id,
        volunteerData
    );

    res.status(200).json(updatedVolunteer);
}

// Update a volunteer's profile based on the volunteer_id
async function shiftCheckIn(req: AuthenticatedRequest, res: Response) {
    const { volunteerID, scheduleID, shiftDate } = req.body;

    const updatedVolunteer = await volunteerModel.shiftCheckIn(volunteerID, scheduleID, shiftDate);
    
    res.status(200).json(updatedVolunteer);
}

async function getPreferredClassesById(req: AuthenticatedRequest, res: Response) {
    const { volunteer_id } = req.params;

    if (!volunteer_id) {
        return res.status(400).json({
            error: "Missing required parameter: 'volunteer_id'",
        });
    }

    const preferred_classes = await volunteerModel.getPreferredClassesById(volunteer_id);

    res.status(200).json(preferred_classes);
}

async function getAllClassPreferences(req: AuthenticatedRequest, res: Response) {
    const all_preferred_classes = await volunteerModel.getAllClassPreferences();
    res.status(200).json(all_preferred_classes);
}

async function updatePreferredClassesById (req: AuthenticatedRequest, res: Response) {
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

    await volunteerModel.updatePreferredClassesById(volunteer_id, data);

    res.status(200).json({msg: "Successfully updated class preferences"});
}

async function verifyVolunteer(
    req: AuthenticatedRequest,
    res: Response
): Promise<any> {
    const { volunteer_id } = req.params;
    const { signoff } = req.body;

    await volunteerModel.verifyVolunteer(volunteer_id, signoff);
    
    return res.status(200).json({
        message: "User verified successfully",
    });
}

async function deactivateVolunteer(
    req: AuthenticatedRequest,
    res: Response
): Promise<any> {
    const { volunteer_id } = req.params;
    const { signoff } = req.body;

    await volunteerModel.deactivateVolunteer(volunteer_id, signoff);

    return res.status(200).json({
        message: "User deactivated successfully",
    });
}

export {
    deactivateVolunteer, getAllClassPreferences, getPreferredClassesById, getVolunteerById,
    getVolunteers, shiftCheckIn, updatePreferredClassesById, updateVolunteer, verifyVolunteer
};

