import { Request, Response, Router } from "express";
import multer from 'multer';

import {
    getVolunteerById,
    getVolunteers,
    shiftCheckIn,
    updateVolunteer,
    getPreferredClassesById
} from "../controllers/volunteerController.js";

import { body, param } from "express-validator";
import { RouteDefinition } from "../common/types.js";
import {
    getAvailabilities,
    getAvailabilityByVolunteerId,
    setAvailabilityByVolunteerId,
    updateAvailabilityByVolunteerId,
} from "../controllers/availabilityController.js";

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
            validation: [
                body('volunteer_id').isUUID('4'),
                body('fk_schedule_id').isInt({ min: 0 }),
                body('shift_date').isDate({ format: 'YYYY-MM-DD'}),
            ],
            action: shiftCheckIn
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
                    validation: [
                        param('volunteer_id').isUUID('4')
                    ],
                    children: [
                        {
                            path: '/',
                            method: 'get',
                            action: getAvailabilityByVolunteerId
                        },
                        {
                            path: '/',
                            method: 'put',
                            validation: [
                                body().isArray({ min: 0 }),
                                body('*.day').isInt({ min: 1, max: 7 }),
                                body('*.start_time').isTime({ hourFormat: 'hour24' }),
                                body('*.end_time').isTime({ hourFormat: 'hour24' }),
                            ],
                            action: updateAvailabilityByVolunteerId
                        },
                        {
                            path: '/',
                            method: 'post',
                            validation: [
                                body().isArray({ min: 0 }),
                                body('*.day').isInt({ min: 1, max: 7 }),
                                body('*.start_time').isTime({ hourFormat: 'hour24' }),
                                body('*.end_time').isTime({ hourFormat: 'hour24' }),
                            ],
                            action: setAvailabilityByVolunteerId
                        },
                    ]
                },
            ]
        },
        {
            path: '/class-preferences',
            children: [
                {
                    path: '/:volunteer_id',
                    method: 'get',
                    validation: [
                        param('volunteer_id').isUUID('4')
                    ],
                    action: getPreferredClassesById
                }
            ]
        },
        {
            path: '/:volunteer_id',
            validation: [
                param('volunteer_id').isUUID('4')
            ],
            children: [
                {
                    path: '/',
                    method: 'get',
                    action: getVolunteerById
                },
                {
                    path: '/',
                    method: 'put',
                    validation: [
                        body('p_name').isString().optional(),
                        body('f_name').isString().optional(),
                        body('l_name').isString().optional(),
                        body('total_hours').isInt().optional(),
                        body('bio').isString().optional(),
                        body('pronouns').isString().optional(),
                        body('phone_number').isMobilePhone('en-US').optional(),
                        body('city').isString().optional(),
                        body('province').isString().optional(),
                    ],
                    action: updateVolunteer
                },
            ]
        },
    ]
};
