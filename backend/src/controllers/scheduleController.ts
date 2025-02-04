import { Request, Response } from 'express';
import { ScheduleDB } from '../common/generated.js';
import ScheduleModel from '../models/scheduleModel.js';

const scheduleModel = new ScheduleModel();

async function getAllSchedules(req: Request, res: Response) {
    const schedules = await scheduleModel.getAllSchedules();
    
    res.status(200).json(schedules);
}

async function getActiveSchedulesForClass(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);

    const schedules = await scheduleModel.getActiveSchedulesForClass(class_id);

    res.status(200).json(schedules);
}

async function addSchedulesToClass(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedules: ScheduleDB[] = req.body;

    const result = await scheduleModel.addSchedulesToClass(class_id, schedules);

    res.status(200).json(result);
}

async function deleteOrSoftDeleteSchedules(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const { schedule_ids } = req.body;

    const result = await scheduleModel.deleteOrSoftDeleteSchedules(class_id, schedule_ids);

    res.status(200).json(result);
}

async function deleteSchedules(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const { schedule_ids } = req.body;

    const result = await scheduleModel.deleteSchedulesFromClass(class_id, schedule_ids);

    res.status(200).json(result);
}

async function assignVolunteersToSchedule(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedule_id = Number(req.params.schedule_id);
    const { volunteer_ids } = req.body;

    const result = await scheduleModel.assignVolunteersByScheduleId(class_id, schedule_id, volunteer_ids);

    res.status(200).json(result);
}

async function updateScheduleById(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedule_id = Number(req.params.schedule_id);
    const schedule: ScheduleDB = req.body;

    const result = await scheduleModel.updateScheduleById(class_id, schedule_id, schedule);

    res.status(200).json(result);
}

async function updateSchedulesForClass(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedules: ScheduleDB[] = req.body;

    const result = await scheduleModel.updateSchedulesForClass(class_id, schedules);

    res.status(200).json(result);
}

export {
    getAllSchedules,
    getActiveSchedulesForClass,
    deleteOrSoftDeleteSchedules,
    deleteSchedules,
    addSchedulesToClass,
    assignVolunteersToSchedule,
    updateScheduleById,
    updateSchedulesForClass
};

