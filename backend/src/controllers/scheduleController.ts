import { Request, Response } from 'express';
import { ScheduleDB } from '../common/generated.js';
import ScheduleModel from '../models/scheduleModel.js';

const scheduleModel = new ScheduleModel();

async function getAllSchedules(req: Request, res: Response) {
    const schedules = await scheduleModel.getAllSchedules();
    
    res.status(200).json(schedules);
}

async function getBundleFromClass(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);

    const schedules = await scheduleModel.getBundleFromClass(class_id);

    res.status(200).json(schedules);
}

async function addBundle(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedules: ScheduleDB[] = req.body;

    const result = await scheduleModel.addBundle(class_id, schedules);

    res.status(200).json(result);
}

async function deleteBundle(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const { schedule_ids } = req.body;

    const result = await scheduleModel.deleteBundle(class_id, schedule_ids);

    res.status(200).json(result);
}

async function assignVolunteers(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedule_id = Number(req.params.schedule_id);
    const { volunteer_ids } = req.body;

    const result = await scheduleModel.assignVolunteers(class_id, schedule_id, volunteer_ids);

    res.status(200).json(result);
}

async function updateSchedule(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedule_id = Number(req.params.schedule_id);
    const {volunteer_ids, ...schedule} = req.body;

    const result = await scheduleModel.updateSchedule(class_id, schedule_id, schedule, volunteer_ids);

    res.status(200).json(result);
}

async function updateBundle(req: Request, res: Response) {
    const class_id = Number(req.params.class_id);
    const schedules: ScheduleDB[] = req.body;

    const result = await scheduleModel.updateBundle(class_id, schedules);

    res.status(200).json(result);
}

export {
    getAllSchedules,
    getBundleFromClass,
    deleteBundle,
    addBundle,
    assignVolunteers,
    updateSchedule,
    updateBundle
};

