import { Router } from 'express'

const volunteerController = require('../controllers/volunteerController.js')
const router = Router()

// get volunteer profile by id
router.get('/volunteer/:id', volunteerController.getVolunteerById);

// get all volunteers
router.get('/volunteers', volunteerController.getVolunteers);