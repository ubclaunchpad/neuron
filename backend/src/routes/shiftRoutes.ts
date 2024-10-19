import { Router, Request, Response } from 'express';

import { 
    getShiftInfo,
    getShiftsByVolunteerId, 
    getShiftsByDate 
} from '../controllers/shiftController.js';

const router = Router();

// gets all info associated with a shift
router.post('/info', (req: Request, res: Response) => { 
    getShiftInfo(req, res); 
 });

 // get shifts assigned to a volunteer by their volunteer id
router.get('/:volunteer_id', (req: Request, res: Response) => { 
    getShiftsByVolunteerId(req, res) 
});

// get shifts on a given date
router.post('/on-date', (req: Request, res: Response) => { 
    getShiftsByDate(req, res)
});

export default router;