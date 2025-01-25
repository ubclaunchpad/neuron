import { Request, Response } from 'express';
import { AvailabilityDB } from '../common/generated.js';
import AvailabilityModel from '../models/availabilityModel.js';

const availabilityModel = new AvailabilityModel();

async function getAvailabilities(req: Request, res: Response) {
    const availabilities = await availabilityModel.getAvailabilities();

    res.status(200).json(availabilities);
}

async function getAvailabilityByVolunteerId(req: Request, res: Response) {
    const { volunteer_id } = req.params;

    const availability = await availabilityModel.getAvailabilityByVolunteerId(volunteer_id);

    res.status(200).json(availability);
}

async function setAvailabilityByVolunteerId(req: Request, res: Response) {
    const { volunteer_id } = req.params;
    const availabilities: AvailabilityDB[] = req.body;

    const result = await availabilityModel.setAvailabilityByVolunteerId(volunteer_id, availabilities);

    res.status(200).json(result);
}

async function updateAvailabilityByVolunteerId(req: Request, res: Response) {
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
