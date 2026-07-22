import express from 'express';
import { getSeatConfigurations, createOrUpdateSeatConfig, deleteSeatConfig } from '../controllers/seatConfigController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getSeatConfigurations);
router.post('/', protect, createOrUpdateSeatConfig);
router.delete('/:id', protect, deleteSeatConfig);

export default router;
