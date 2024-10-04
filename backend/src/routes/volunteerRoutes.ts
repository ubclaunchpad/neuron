import { Router } from 'express'

const volunteerController = require('../controllers/volunteerController.js')
const router = Router()

// get volunteer profile by id
router.get('/volunteer/:volunteer_id', volunteerController.getVolunteerById);

// get all volunteers
router.get('/volunteers', volunteerController.getVolunteers);

// update volunteer profile
router.put('/volunteer/:volunteer_id', volunteerController.updateVolunteer);