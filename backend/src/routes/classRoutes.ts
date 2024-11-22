import express from 'express';
import { Request, Response } from 'express';
import ClassesController from '../controllers/classController.js';
import multer from 'multer';

const router = express.Router();
const classController = new ClassesController();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', async (req: Request, res: Response) => {
    await classController.getAllClasses(req, res);
});

router.post('/', async (req: Request, res: Response) => {
    await classController.addClass(req, res);
});

router.get('/images', async (req: Request, res: Response) => {
    await classController.getAllImages(req, res);
});

router.get('/images/:class_id', async (req: Request, res: Response) => {
    await classController.getImageByClassId(req, res);
});

router.put('/images/:class_id', upload.single('image'), async (req: Request, res: Response) => {
    await classController.uploadImage(req, res);
});


export default router;