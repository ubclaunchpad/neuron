//volunteerRoutes.js
import { Router } from 'express';
import { getVolunteerAvailability } from '../controllers/volunteerController.js';

const router = Router();

// Define the GET route for fetching volunteer availability
router.get('/volunteer/:id/availability', getVolunteerAvailability);

export default router;