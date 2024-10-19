import { Router, Request, Response } from 'express';

import { 
    getShiftsByVolunteerId, 
    getShiftsByDate 
} from '../controllers/shiftController.js';

const router = Router();

// get shifts assigned to a volunteer by their volunteer id
router.get('/volunteer-shifts/:volunteer_id', (req: Request, res: Response) => { 
    getShiftsByVolunteerId(req, res) 
});

// get shifts on a given date
router.post('/on-date', (req: Request, res: Response) => { 
    getShiftsByDate(req, res)
});

export default router;