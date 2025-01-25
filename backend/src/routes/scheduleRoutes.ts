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
      children: [
        {
          path: '/',
          method: 'get',
          action: getSchedulesByClassId
        },
        {
          path: '/',
          method: 'post',
          action: setSchedulesByClassId
        },
        {
          path: '/',
          method: 'put',
          action: updateSchedulesByClassId
        },
        {
          path: '/',
          method: 'delete',
          action: deleteSchedules
        },
      ]
    },
  ]
};
