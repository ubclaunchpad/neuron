import { Router, Request, Response } from 'express';

import { 
    getVolunteerById, 
    getVolunteers, 
    updateVolunteer,
    addVolunteer,
    getVolunteerWithUserEmail
} from '../controllers/volunteerController.js';

const router = Router();

// get volunteer profile by id
router.get('/volunteer/:volunteer_id', (req: Request, res: Response) => { getVolunteerById(req, res) });

// get all volunteers
router.get('/volunteers', (req: Request, res: Response) => { getVolunteers(req, res) });

// update volunteer profile
router.put('/volunteer/:volunteer_id', (req: Request, res: Response) => { updateVolunteer(req, res) });

// post api to add a volunteer
router.post('/volunteer', (req: Request, res: Response) => { addVolunteer(req, res) });

// get api to get all volunteers with user email
router.get('/volunteers/user-email', (req: Request, res: Response) => { getVolunteerWithUserEmail(req, res) });