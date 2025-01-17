import { Request, Response } from 'express';
import { Schedule } from '../common/generated.js';
import ScheduleModel from '../models/scheduleModel.js';

const scheduleModel = new ScheduleModel();

async function getSchedules(req: Request, res: Response) {
  try {
    const schedules = await scheduleModel.getSchedules();
    res.status(200).json(schedules);
  } catch (error: any) {
		return res.status(500).json({
			error: `${error.message}`
		});
	}
}

async function getSchedulesByClassId(req: Request, res: Response) {
  const { class_id } = req.params;

  if (!class_id) {
    return res.status(400).json({
      error: "Missing required parameter: 'class_id'"
    });
  }

  try {
    const schedules = await scheduleModel.getSchedulesByClassId(class_id);
    res.status(200).json(schedules);
  } catch (error: any) {
		return res.status(500).json({
			error: `${error.message}`
		});
	}
}

function isValidSchedules(data: any): data is Schedule[] {
  return Array.isArray(data) && data.every((schedule) => {
    return (
      // Validate its day is a number between 1 and 7
      typeof schedule.day === "number" &&
      (schedule.day >= 1 && schedule.day <= 7) &&

      // Validate its start_time is a string between 00:00 and 23:59
      typeof schedule.start_time === "string" &&
      schedule.start_time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) &&

      // Validate its end_time is a string between 00:00 and 23:59
      typeof schedule.end_time === "string" &&
      schedule.end_time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)

      // TODO: May need to validate start_time < end_time
    )
  });
}

async function setSchedulesByClassId(req: Request, res: Response) {
  const { class_id } = req.params;
  const schedules: Schedule[] = req.body;

  if (!class_id) {
    return res.status(400).json({
      error: "Missing required parameter: 'class_id'"
    });
  }

  if (!isValidSchedules(schedules)) {
    return res.status(400).json({
      error: "Invalid schedule data"
    });
  }

  try {
    const result = await scheduleModel.setSchedulesByClassId(class_id, schedules);
    res.status(200).json(result);
  } catch (error: any) {
		return res.status(500).json({
			error: `${error.message}`
		});
	}
}


async function updateSchedulesByClassId(req: Request, res: Response) {
  const { class_id } = req.params;
  const schedules: Schedule[] = req.body;

  if (!class_id) {
    return res.status(400).json({
      error: "Missing required parameter: 'class_id'"
    });
  }

  if (!isValidSchedules(schedules)) {
    return res.status(400).json({
      error: "Invalid schedule data"
    });
  }

  try {
    const result = await scheduleModel.updateSchedulesByClassId(class_id, schedules);
    res.status(200).json(result);
  } catch (error: any) {
		return res.status(500).json({
			error: `${error.message}`
		});
	}
}

export {
  getSchedules,
  getSchedulesByClassId,
  setSchedulesByClassId,
  updateSchedulesByClassId
};
