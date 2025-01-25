import { body, param } from 'express-validator';
import {
    addShift,
    deleteShift,
    getShiftInfo,
    getShiftsByDate,
    getShiftsByVolunteerId,
    getShiftsByVolunteerIdAndMonth,
    requestToCoverShift,
    updateShift
} from '../controllers/shiftController.js';
import { RouteDefinition } from './routes.js';

export const ShiftRoutes: RouteDefinition = {
    path: '/shifts',
    children: [
        {
            path: '/',
            method: 'post',
            validation: [
                body('fk_volunteer_id').isUUID('4'),
                body('shift_date').isDate({ format: 'YYYY-MM-DD' }),
                body('fk_schedule_id').isInt({ min: 0 }),
                body('duration').isInt({ min: 0 }),
            ],
            action: addShift
        },
        {
            path: '/info',
            method: 'post',
            action: getShiftInfo
        },
        {
            path: '/:volunteer_id',
            method: 'get',
            validation: [
                param('volunteer_id').isUUID('4')
            ],
            action: getShiftsByVolunteerId
        },
        {
            path: '/on-date',
            method: 'post',
            validation: [
                body('shift_date').isDate({ format: 'YYYY-MM-DD' })
            ],
            action: getShiftsByDate
        },
        {
            // Retrieves all shifts viewable to a specific volunteer in a given month and year.
            // -- The shifts include:
            // -- 1. 'my-shifts' - shifts assigned to the volunteer.
            // -- 2. 'coverage' - shifts available for coverage by other volunteers.
            // -- 3. 'my-coverage-requests' - coverage requests made by the volunteer.
            // -- Returns shift details such as date, time, class, duration, and coverage status.
            path: '/volunteer-month',
            method: 'post',
            validation: [
                body('shift_date').isDate({ format: 'YYYY-MM-DD' }),
                body('fk_volunteer_id').isUUID('4')
            ],
            action: getShiftsByVolunteerIdAndMonth
        },
        {
            path: '/request-to-cover-shift',
            method: 'post',
            validation: [
                body('request_id').isInt({ min: 0 }),
                body('volunteer_id').isUUID('4')
            ],
            action: requestToCoverShift
        },
        {
            path: '/:shift_id',
            validation: [
                param('shift_id').isInt({ min: 0 })
            ],
            children: [
                {
                    path: '/',
                    method: 'put',
                    validation: [
                        body('fk_volunteer_id').isUUID('4').optional(),
                        body('shift_date').isDate({ format: 'YYYY-MM-DD' }).optional(),
                        body('duration').isInt({ min: 0 }).optional(),
                    ],
                    action: updateShift
                },
                {
                    path: '/',
                    method: 'put',
                    action: deleteShift
                },
            ]
        }
    ]
};