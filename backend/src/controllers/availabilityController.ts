import { Response } from 'express';
import { AvailabilityDB } from '../common/databaseModels.js';
import { AuthenticatedRequest } from '../common/types.js';
import { availabilityModel } from '../config/models.js';

async function getAvailabilities(req: AuthenticatedRequest, res: Response) {
    const availabilities = await availabilityModel.getAvailabilities();

    res.status(200).json(availabilities);
}

async function getAvailabilityByVolunteerId(req: AuthenticatedRequest, res: Response) {
    const { volunteer_id } = req.params;

    const availability = await availabilityModel.getAvailabilityByVolunteerId(volunteer_id);
    
    res.status(200).json(availability);
}

async function setAvailabilityByVolunteerId(req: AuthenticatedRequest, res: Response) {
    const { volunteer_id } = req.params;
    const availabilities: AvailabilityDB[] = req.body;

    const result = await availabilityModel.setAvailabilityByVolunteerId(volunteer_id, availabilities);

    res.status(200).json(result);
}

async function updateAvailabilityByVolunteerId(req: AuthenticatedRequest, res: Response) {
    const { volunteer_id } = req.params;
    const availabilities: AvailabilityDB[] = req.body;

    const result = await availabilityModel.updateAvailabilityByVolunteerId(volunteer_id, availabilities);

    res.status(200).json(result);
}

export {
    getAvailabilities,
    getAvailabilityByVolunteerId,
    setAvailabilityByVolunteerId,
    updateAvailabilityByVolunteerId
};
