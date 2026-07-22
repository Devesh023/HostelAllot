import express from 'express';
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch } from '../controllers/branchController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getBranches);
router.get('/:id', protect, getBranchById);
router.post('/', protect, createBranch);
router.put('/:id', protect, updateBranch);
router.delete('/:id', protect, deleteBranch);

export default router;
