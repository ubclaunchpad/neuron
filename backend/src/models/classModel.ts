import express from 'express';
import { getAllClasses } from '../controllers/classController.js';

const router = express.Router();

router.get('/', getAllClasses);

export default router;