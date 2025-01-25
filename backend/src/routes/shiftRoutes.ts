import { param } from 'express-validator';
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
            action: getShiftsByVolunteerId
        },
        {
            path: '/on-date',
            method: 'post',
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
            action: getShiftsByVolunteerIdAndMonth
        },
        {
            path: '/request-to-cover-shift',
            method: 'post',
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