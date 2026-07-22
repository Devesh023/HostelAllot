import express from 'express';
import { getHostels, getHostelById, createHostel, updateHostel, deleteHostel } from '../controllers/hostelController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getHostels);
router.get('/:id', protect, getHostelById);
router.post('/', protect, createHostel);
router.put('/:id', protect, updateHostel);
router.delete('/:id', protect, deleteHostel);

export default router;
