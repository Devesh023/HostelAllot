import express from 'express';
import { generatePdfReport, generateExcelReport, generateAllotmentLetter } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/pdf', protect, generatePdfReport); // GET /api/reports/pdf?type=allotment
router.get('/excel', protect, generateExcelReport); // GET /api/reports/excel?type=allotment
router.get('/allotment-letter', protect, generateAllotmentLetter);

export default router;
