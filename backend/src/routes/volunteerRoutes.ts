import { Request, Response, Router } from "express";
import multer from 'multer';

import {
    getVolunteerById,
    getVolunteers,
    shiftCheckIn,
    updateVolunteer,
    getPreferredClassesById
} from "../controllers/volunteerController.js";

import {
    getAvailabilities,
    getAvailabilityByVolunteerId,
    setAvailabilityByVolunteerId,
    updateAvailabilityByVolunteerId,
} from "../controllers/availabilityController.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// get all volunteers
router.get("/volunteers", (req: Request, res: Response) => {
    getVolunteers(req, res);
});

// get all availabilities
router.get("/availabilities", (req: Request, res: Response) => {
    getAvailabilities(req, res);
});

// get availability for a volunteer
router.get("/availability/:volunteer_id", (req: Request, res: Response) => {
    getAvailabilityByVolunteerId(req, res);
});

// set availability for a volunteer
router.post("/availability/:volunteer_id", (req: Request, res: Response) => {
    setAvailabilityByVolunteerId(req, res);
});

// update availability for a volunteer
router.put("/availability/:volunteer_id", (req: Request, res: Response) => {
    updateAvailabilityByVolunteerId(req, res);
});

// get volunteer profile by id
router.get("/:volunteer_id", (req: Request, res: Response) => {
    getVolunteerById(req, res);
});

// update volunteer profile
router.put("/:volunteer_id", (req: Request, res: Response) => {
    updateVolunteer(req, res);
});

// update a volunteer's total hours when checked into a shift
router.post('/shiftCheckIn', (req: Request, res: Response) => { 
    shiftCheckIn(req, res) 
});

// get preferred classes by volunteer id 
router.get("/class_preferences/:volunteer_id", (req: Request, res: Response) => {
    getPreferredClassesById(req, res);
});

export default router;
