import express, { Request, Response } from 'express';
import multer from 'multer'; // Used for file uploads
import { addClass, getAllClasses, getClassById, getClassesByDay, uploadClassImage } from '../controllers/classController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', async (req: Request, res: Response) => {
    await getAllClasses(req, res);
});

router.get('/:class_id', async (req: Request, res: Response) => {
    await getClassById(req, res);
});

router.get("/schedule/:day", async (req, res) => {
    await getClassesByDay(req, res);
});

router.post('/', async (req: Request, res: Response) => {
    await addClass(req, res);
});

router.put('/:class_id/upload', upload.single('image'), async (req: Request, res: Response) => {
    await uploadClassImage(req, res);
});


export default router;