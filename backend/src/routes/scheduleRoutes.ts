import { body, param } from 'express-validator';
import { RouteDefinition } from "../common/types.js";
import { 
    addBundle, 
    assignVolunteers, 
    deleteBundle, 
    getAllSchedules, 
    getBundleFromClass, 
    updateBundle, 
    updateSchedule 
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
                    action: getBundleFromClass
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
                    action: addBundle
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
                    action: updateBundle
                },
                {
                    path: '/:schedule_id',
                    method: 'put',
                    validation: [
                        param('schedule_id').isInt({ min: 1 }),
                        body('day').isInt({ min: 1, max: 7 }).optional(),
                        body('start_time').isTime({ hourFormat: 'hour24' }).optional(),
                        body('end_time').isTime({ hourFormat: 'hour24' }).optional(),
                        body('volunteer_ids').isArray({ min: 1 }).optional(),
                    ],
                    action: updateSchedule
                },
                {
                    path: '/',
                    method: 'delete',
                    validation: [
                        body('schedule_ids').isArray({ min: 0}),
                        body('schedule_ids.*').isInt({ min: 0}),
                    ],
                    action: deleteBundle
                },
                {
                    path: '/:schedule_id',
                    method: 'post',
                    validation: [
                        param('schedule_id').isInt({ min: 1}),
                        body('volunteer_ids').isArray({ min: 1 }),
                    ],
                    action: assignVolunteers
                }
            ]
        },
    ]
};
