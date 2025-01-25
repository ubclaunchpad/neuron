import { Request, Response, Router } from "express";

import {
    getVolunteerById,
    getVolunteers,
    shiftCheckIn,
    updateVolunteer
} from "../controllers/volunteerController.js";

import {
    getAvailabilities,
    getAvailabilityByVolunteerId,
    setAvailabilityByVolunteerId,
    updateAvailabilityByVolunteerId,
} from "../controllers/availabilityController.js";
import { RouteDefinition } from "./routes.js";

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

// update a volunteer's total hours when checked into a shift
router.post('/shiftCheckIn', (req: Request, res: Response) => { 
    shiftCheckIn(req, res) 
});

export const VolunteerRoutes: RouteDefinition = {
    path: '/volunteer',
    children: [
        {
            path: '/',
            method: 'get',
            action: getVolunteers
        },
        {
            path: '/shift-check-in',
            method: 'post',
            action: shiftCheckIn
        },
        {
            path: '/:volunteer_id',
            children: [
                {
                    path: '/',
                    method: 'get',
                    action: getVolunteerById
                },
                {
                    path: '/',
                    method: 'put',
                    action: updateVolunteer
                },
            ]
        },
        {
            path: '/availability',
            children: [
                {
                    path: '/',
                    method: 'get',
                    action: getAvailabilities
                },
                {
                    path: '/:volunteer_id',
                    children: [
                        {
                            path: '/',
                            method: 'get',
                            action: getAvailabilityByVolunteerId
                        },
                        {
                            path: '/',
                            method: 'put',
                            action: updateAvailabilityByVolunteerId
                        },
                        {
                            path: '/',
                            method: 'post',
                            action: setAvailabilityByVolunteerId
                        },
                    ]
                },
            ]
        }
    ]
};
