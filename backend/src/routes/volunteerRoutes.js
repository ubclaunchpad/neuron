const router = express('router')
const controller = require('../controllers/volunteerController')

// get volunteer profile by email
router.post('/volunteer-profile', controller.getVolunteerProfile) 

// get all volunteers
router.get('/volunteers', controller.getVolunteers) 