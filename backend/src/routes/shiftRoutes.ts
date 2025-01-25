import { Router, Request, Response } from 'express';
import { 
    getShiftInfo,
    getShiftsByVolunteerId, 
    getShiftsByDate,
    getShiftsByVolunteerIdAndMonth,
    requestToCoverShift,
    addShift,
    updateShift,
    deleteShift
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

// Retrieves all shifts viewable to a specific volunteer in a given month and year.
// -- The shifts include:
// -- 1. 'my-shifts' - shifts assigned to the volunteer.
// -- 2. 'coverage' - shifts available for coverage by other volunteers.
// -- 3. 'my-coverage-requests' - coverage requests made by the volunteer.
// -- Returns shift details such as date, time, class, duration, and coverage status.
router.post('/volunteer-month', (req: Request, res: Response) => {
    getShiftsByVolunteerIdAndMonth(req, res);
});

// volunteer requesting to cover someone else’s open shift
router.post('/request-to-cover-shift', (req: Request, res: Response) => {
    requestToCoverShift(req, res);
});

// create a new shift, either unassigned or assigned to a volunteer by id
router.post('/', (req: Request, res: Response) => {
    addShift(req, res);
})

// update a shift by id
router.put('/:shift_id', (req: Request, res: Response) => {
    updateShift(req, res);
})

// delete a shift by id
router.delete('/:shift_id', (req: Request, res: Response) => {
    deleteShift(req, res);
})

export default router;