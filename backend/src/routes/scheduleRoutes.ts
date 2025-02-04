import { body, param } from 'express-validator';
import { RouteDefinition } from "../common/types.js";
import { 
    addSchedulesToClass, 
    assignVolunteersToSchedule, 
    deleteOrSoftDeleteSchedules, 
    deleteSchedules,
    getAllSchedules, 
    getActiveSchedulesForClass, 
    updateSchedulesForClass, 
    updateScheduleById 
} from '../controllers/scheduleController.js';

export const ScheduleRoutes: RouteDefinition = {
    path: '/schedules',
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
                        body().isArray({ min: 0 }),
                        body('*.day').isInt({ min: 1, max: 7 }),
                        body('*.start_time').isTime({ hourFormat: 'hour24' }),
                        body('*.end_time').isTime({ hourFormat: 'hour24' }),
                        body('*.volunteer_ids').isArray({ min: 1 }).optional(),
                    ],
                    action: addSchedulesToClass
                },
                {
                    path: '/',
                    method: 'put',
                    validation: [
                        body().isArray({ min: 2 }), // if less than 1, just use updateSchedule
                        body('*.schedule_id').isInt({ min: 1 }),
                        body('*.day').isInt({ min: 1, max: 7 }),
                        body('*.start_time').isTime({ hourFormat: 'hour24' }),
                        body('*.end_time').isTime({ hourFormat: 'hour24' }),
                        body('*.volunteer_ids').isArray({ min: 0 }).optional(),
                    ],
                    action: updateSchedulesForClass
                },
                {
                    path: '/:schedule_id',
                    method: 'put',
                    validation: [
                        param('schedule_id').isInt({ min: 1 }),
                        body('day').isInt({ min: 1, max: 7 }),
                        body('start_time').isTime({ hourFormat: 'hour24' }),
                        body('end_time').isTime({ hourFormat: 'hour24' }),
                        body('volunteer_ids').isArray({ min: 1 }).optional(),
                    ],
                    action: updateScheduleById
                },
                {
                    path: '/soft-option',
                    method: 'delete',
                    validation: [
                        body('schedule_ids').isArray({ min: 0}),
                        body('schedule_ids.*').isInt({ min: 0}),
                    ],
                    action: deleteOrSoftDeleteSchedules
                },
                {
                    path: '/',
                    method: 'delete',
                    validation: [
                        body('schedule_ids').isArray({ min: 0}),
                        body('schedule_ids.*').isInt({ min: 0}),
                    ],
                    action: deleteSchedules
                },
                {
                    path: '/:schedule_id',
                    method: 'post',
                    validation: [
                        param('schedule_id').isInt({ min: 1}),
                        body('volunteer_ids').isArray({ min: 1 }),
                    ],
                    action: assignVolunteersToSchedule
                }
            ]
        },
    ]
};
