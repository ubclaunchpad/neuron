import { Router } from 'express'

const volunteerController = require('../controllers/volunteerController.js')
const router = Router()

// get volunteer profile by email
router.post('/volunteer-profile', volunteerController.getVolunteerByEmail);

// get all volunteers
router.get('/volunteers', volunteerController.getVolunteers);