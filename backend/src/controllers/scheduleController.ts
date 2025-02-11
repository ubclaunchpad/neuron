import { Response } from 'express';
import { ScheduleDB } from '../common/generated.js';
import { AuthenticatedRequest } from '../common/types.js';
import ScheduleModel from '../models/scheduleModel.js';

const scheduleModel = new ScheduleModel();

async function getAllSchedules(req: AuthenticatedRequest, res: Response) {
    const schedules = await scheduleModel.getAllSchedules();
    
    res.status(200).json(schedules);
}

async function getActiveSchedulesForClass(req: AuthenticatedRequest, res: Response) {
    const class_id = Number(req.params.class_id);

    const schedules = await scheduleModel.getActiveSchedulesForClass(class_id);

    res.status(200).json(schedules);
}

async function addSchedulesToClass(req: AuthenticatedRequest, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedules: ScheduleDB[] = req.body;

    const result = await scheduleModel.addSchedulesToClass(class_id, schedules);

    res.status(200).json(result);
}

async function deleteOrSoftDeleteSchedules(req: AuthenticatedRequest, res: Response) {
    const class_id = Number(req.params.class_id);
    const { schedule_ids } = req.body;

    const result = await scheduleModel.deleteOrSoftDeleteSchedules(class_id, schedule_ids);

    res.status(200).json(result);
}

async function deleteSchedulesFromClass(req: AuthenticatedRequest, res: Response) {
    const class_id = Number(req.params.class_id);
    const { schedule_ids } = req.body;

    const result = await scheduleModel.deleteSchedulesFromClass(class_id, schedule_ids);

    res.status(200).json(result);
}

async function assignVolunteersToSchedule(req: AuthenticatedRequest, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedule_id = Number(req.params.schedule_id);
    const { volunteer_ids } = req.body;

    const result = await scheduleModel.assignVolunteersByScheduleId(class_id, schedule_id, volunteer_ids);

    res.status(200).json(result);
}

async function updateSchedulesForClass(req: AuthenticatedRequest, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedules: ScheduleDB[] = req.body;

    const result = await scheduleModel.updateSchedulesForClass(class_id, schedules);

    res.status(200).json(result);
}

export {
    addSchedulesToClass,
    assignVolunteersToSchedule, deleteOrSoftDeleteSchedules,
    deleteSchedulesFromClass, getActiveSchedulesForClass, getAllSchedules, updateSchedulesForClass
};

