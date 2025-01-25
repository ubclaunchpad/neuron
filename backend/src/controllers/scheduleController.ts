import { Request, Response } from 'express';
import { ScheduleDB } from '../common/generated.js';
import ScheduleModel from '../models/scheduleModel.js';

const scheduleModel = new ScheduleModel();

async function getSchedules(req: Request, res: Response) {
    const schedules = await scheduleModel.getSchedules();
    res.status(200).json(schedules);
}

async function getSchedulesByClassId(req: Request, res: Response) {
  const class_id = Number(req.params.class_id);

    const schedules = await scheduleModel.getSchedulesByClassId(class_id);
    res.status(200).json(schedules);
}

async function setSchedulesByClassId(req: Request, res: Response) {
  const class_id = Number(req.params.class_id);
  const schedules: ScheduleDB[] = req.body;

    const result = await scheduleModel.setSchedulesByClassId(class_id, schedules);

    res.status(200).json(result);
}

async function updateSchedulesByClassId(req: Request, res: Response) {
  const class_id = Number(req.params.class_id);
  const schedules: ScheduleDB[] = req.body;

    const result = await scheduleModel.updateSchedulesByClassId(class_id, schedules);
    
    res.status(200).json(result);
}

async function deleteSchedules(req: Request, res: Response) {
  const class_id = Number(req.params.class_id);
  const { schedule_ids } = req.body;

  if (!schedule_ids) {
    return res.status(400).json({
      error: "Missing required field: 'schedule_ids'"
    });
  }

  if (!Array.isArray(schedule_ids)) {
    return res.status(400).json({
      error: "Invalid field: 'schedule_ids' should be an array of values"
    });
  }

  try {
    const result = await scheduleModel.deleteSchedulesByScheduleId(class_id, schedule_ids);
    res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: `Internal server error: ${JSON.stringify(error)}`
    });
  }
}

export {
  deleteSchedules, getSchedules,
  getSchedulesByClassId,
  setSchedulesByClassId,
  updateSchedulesByClassId
};

