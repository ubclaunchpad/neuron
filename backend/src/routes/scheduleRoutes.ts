import { body, param } from 'express-validator';
import { deleteSchedules, getSchedules, getSchedulesByClassId, setSchedulesByClassId, updateSchedulesByClassId } from '../controllers/scheduleController.js';
import { RouteDefinition } from './routes.js';

export const ScheduleRoutes: RouteDefinition = {
    path: '/schedules',
    children: [
        {
            path: '/',
            method: 'get',
            action: getSchedules
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
                    action: getSchedulesByClassId
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
                    action: setSchedulesByClassId
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
                    action: updateSchedulesByClassId
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
            ]
        },
    ]
};
