import { body, param } from 'express-validator';
import { RouteDefinition } from "../common/types.js";
import { isAuthorized } from '../config/authCheck.js';
import {
    addShift,
    checkInShift,
    deleteShift,
    getShiftInfo,
    getShiftsByDate,
    getShiftsByVolunteerId,
    getShiftsByVolunteerIdAndMonth,
    requestAbsence,
    requestCoverShift,
    updateShift,
    withdrawAbsenceRequest,
    withdrawCoverShift
} from '../controllers/shiftController.js';

export const ShiftRoutes: RouteDefinition = {
    path: '/shifts',
    middleware: [
        isAuthorized,
    ],
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
            validation: [
                body('fk_volunteer_id').isUUID('4'),
                body('shift_date').isDate({ format: 'YYYY-MM-DD' }),
                body('fk_schedule_id').isInt({ min: 0 }),
            ],
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
            path: '/check-in/:shift_id',
            method: 'patch',
            validation: [
                param('shift_id').isInt({ min: 0 })
            ],
            action: checkInShift
        },
        {
            path: '/cover-shift',
            method: 'post',
            validation: [
                body('request_id').isInt({ min: 0 }),
                body('volunteer_id').isUUID('4')
            ],
            action: requestCoverShift
        },
        {
            path: '/cover-shift',
            method: 'delete',
            validation: [
                body('request_id').isInt({ min: 0 }),
                body('volunteer_id').isUUID('4')
            ],
            action: withdrawCoverShift
        },
        {
            path: '/shift-coverage-request',
            method: 'post',
            validation: [
                body('shift_id').isInt({ min: 0 }),
            ],
            action: requestAbsence
        },
        {
            path: '/shift-coverage-request',
            method: 'delete',
            validation: [
                body('request_id').isInt({ min: 0 }),
                body('shift_id').isInt({ min: 0 }),
            ],
            action: withdrawAbsenceRequest
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