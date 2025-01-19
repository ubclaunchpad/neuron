import express from 'express';
import { Request, Response } from 'express';
import { 
    getAllClasses, 
    getClassById, 
    getClassesByDay, 
    addClass, 
    updateClass,
    deleteClass,
    getAllImages, 
    getImageByClassId, 
    uploadClassImage
} from '../controllers/classController.js';
import multer from 'multer'; // Used for file uploads

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

router.put('/:class_id', async (req: Request, res: Response) => {
    await updateClass(req, res);
});

router.delete('/:class_id', async (req: Request, res: Response) => {
    await deleteClass(req, res);
});

router.put('/:class_id/upload', upload.single('image'), async (req: Request, res: Response) => {
    await uploadClassImage(req, res);
});


export default router;