import express from 'express';
import { getAllClasses } from '../controllers/classController.js';

const router = express.Router();

router.get('/volunteer/classes', getAllClasses);

export default router;