import { Router, Request, Response } from 'express';
import { 
  getSchedules, 
  getSchedulesByClassId, 
  setSchedulesByClassId, 
  updateSchedulesByClassId,
  deleteSchedules
} from '../controllers/scheduleController.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  await getSchedules(req, res);
});

router.get('/:class_id', async (req: Request, res: Response) => {
  await getSchedulesByClassId(req, res);
});

router.post('/:class_id', async (req: Request, res: Response) => {
  await setSchedulesByClassId(req, res);
});

router.put('/:class_id', async (req: Request, res: Response) => {
  await updateSchedulesByClassId(req, res);
});

router.delete('/:class_id', async (req: Request, res: Response) => {
  await deleteSchedules(req, res);
})

export default router;