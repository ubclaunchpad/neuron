import { Router, Request, Response } from "express";

import {
    getVolunteerById,
    getVolunteers,
    updateVolunteer, 
    shiftCheckIn,
    insertProfilePicture,
    getProfilePicture,
    updateProfilePicture,
    deleteProfilePicture
} from "../controllers/volunteerController.js";

import {
    getAvailabilities,
    getAvailabilityByVolunteerId,
    setAvailabilityByVolunteerId,
    updateAvailabilityByVolunteerId,
} from "../controllers/availabilityController.js";

const router = Router();

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

// create profile picture for a volunteer
router.post("/profile-picture", (req: Request, res: Response) => {
    insertProfilePicture(req, res);
});

// get profile picture of a volunteer
router.get("/profile-picture/:volunteer_id", (req: Request, res: Response) => {
    getProfilePicture(req, res);
});

// update profile picture of a volunteer
router.put("/profile-picture/:volunteer_id", (req: Request, res: Response) => {
    updateProfilePicture(req, res);
});

// delete profile picture of a volunteer
router.delete("/profile-picture/:volunteer_id", (req: Request, res: Response) => {
    deleteProfilePicture(req, res);
});

// update a volunteer's total hours when checked into a shift
router.post('/shiftCheckIn', (req: Request, res: Response) => { 
    shiftCheckIn(req, res) 
});

export default router;
