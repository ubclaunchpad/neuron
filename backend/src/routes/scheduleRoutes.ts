import { Router, Request, Response } from 'express';
import { getSchedules, getSchedulesByClassId, setSchedulesByClassId, updateSchedulesByClassId } from '../controllers/scheduleController.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  getSchedules(req, res);
});

router.get('/:class_id', (req: Request, res: Response) => {
  getSchedulesByClassId(req, res);
});

router.post('/:class_id', (req: Request, res: Response) => {
  setSchedulesByClassId(req, res);
});

router.put('/:class_id', (req: Request, res: Response) => {
  updateSchedulesByClassId(req, res);
});

export default router;