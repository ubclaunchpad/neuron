import express from 'express';
import { Request, Response } from 'express';
import { getAllClasses, getClassById, getClassesByDay, addClass, getAllImages, getImageByClassId, uploadImage } from '../controllers/classController.js';
import multer from 'multer'; // Used for file uploads

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', async (req: Request, res: Response) => {
    await getAllClasses(req, res);
});

router.get('/images', async (req: Request, res: Response) => {
    await getAllImages(req, res);
});

router.get('/images/:class_id', async (req: Request, res: Response) => {
    await getImageByClassId(req, res);
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

router.put('/images/:class_id', upload.single('image'), async (req: Request, res: Response) => {
    await uploadImage(req, res);
});


export default router;