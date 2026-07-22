import express from 'express';
import { getMeritList, getAllotments, generateMerit } from '../controllers/meritController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMeritList); // Matches GET /api/merit
router.get('/allotments', protect, getAllotments);
router.post('/generate-merit', protect, generateMerit); // Matches POST /api/merit/generate-merit

export default router;
