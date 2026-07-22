import express from 'express';
import multer from 'multer';
import { getSettings, updateSettings, exportBackup, restoreBackup } from '../controllers/settingsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);
router.get('/backup', protect, exportBackup);
router.post('/restore', protect, upload.single('file'), restoreBackup);

export default router;
