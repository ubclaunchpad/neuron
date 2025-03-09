import { body, param } from 'express-validator';
import { RouteDefinition } from "../common/types.js";
import { isAuthorized } from '../config/authCheck.js';
import {
    addSchedulesToClass,
    assignVolunteersToSchedule,
    deleteOrSoftDeleteSchedules,
    deleteSchedulesFromClass,
    getActiveSchedulesForClass,
    getAllSchedules,
    updateSchedulesForClass
} from '../controllers/scheduleController.js';
import { Frequency } from '../common/interfaces.js';

export const ScheduleRoutes: RouteDefinition = {
    path: '/schedules',
    middleware: [
        isAuthorized,
    ],
    children: [
        {
            path: '/',
            method: 'get',
            action: getAllSchedules
        },
        {
            path: '/:class_id',
            validation: [
                param('class_id').isInt({ min: 1 })
            ],
            children: [
                {
                    path: '/',
                    method: 'get',
                    action: getActiveSchedulesForClass
                },
                {
                    path: '/',
                    method: 'post',
                    validation: [
                        body().isArray({ min: 1 }),
                        body('*.day').isInt({ min: 0, max: 6 }),
                        body('*.start_time').isTime({ hourFormat: 'hour24' }),
                        body('*.end_time').isTime({ hourFormat: 'hour24' }),
                        body('*.frequency').isIn(Object.values(Frequency)),
                        body('*.volunteer_ids').isArray({ min: 0 }),
                        body('*.volunteer_ids.*').isUUID('4'),
                        body('*.fk_instructor_id').isUUID('4'),
                    ],
                    action: addSchedulesToClass
                },
                {
                    path: '/',
                    method: 'put',
                    validation: [
                        body().isArray({ min: 1 }),
                        body('*.schedule_id').isInt({ min: 1 }),
                        body('*.day').isInt({ min: 0, max: 6 }),
                        body('*.start_time').isTime({ hourFormat: 'hour24' }),
                        body('*.end_time').isTime({ hourFormat: 'hour24' }),
                        body('*.frequency').isIn(Object.values(Frequency)),
                        body('*.volunteer_ids').isArray({ min: 0 }).optional(),
                        body('*.volunteer_ids.*').isUUID('4'),
                        body('*.fk_instructor_id').isUUID('4').optional(),
                    ],
                    action: updateSchedulesForClass
                },
                {
                    path: '/',
                    method: 'delete',
                    validation: [
                        body('schedule_ids').isArray({ min: 1 }),
                        body('schedule_ids.*').isInt({ min: 1 }),
                    ],
                    action: deleteSchedulesFromClass
                },
                {
                    path: '/soft-option',
                    method: 'delete',
                    validation: [
                        body('schedule_ids').isArray({ min: 1 }),
                        body('schedule_ids.*').isInt({ min: 1 }),
                    ],
                    action: deleteOrSoftDeleteSchedules
                },
                {
                    path: '/:schedule_id',
                    method: 'post',
                    validation: [
                        param('schedule_id').isInt({ min: 1}),
                        body('volunteer_ids').isArray({ min: 1 }),
                        body('volunteer_ids.*').isUUID('4')
                    ],
                    action: assignVolunteersToSchedule
                }
            ]
        },
    ]
};
