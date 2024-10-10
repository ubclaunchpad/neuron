import { Router, Request, Response } from 'express';

import { 
    getVolunteerById, 
    getVolunteers, 
    updateVolunteer 
} from '../controllers/volunteerController.js';

const router = Router();

// get volunteer profile by id
router.get('/volunteer/:volunteer_id', (req: Request, res: Response) => { getVolunteerById(req, res) });

// get all volunteers
router.get('/volunteers', (req: Request, res: Response) => { getVolunteers(req, res) });

// update volunteer profile
router.put('/volunteer/:volunteer_id', (req: Request, res: Response) => { updateVolunteer(req, res) });

export default router;