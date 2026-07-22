import express from 'express';
import multer from 'multer';
import { 
  getStudents, 
  getStudentById, 
  createStudent, 
  updateStudent, 
  deleteStudent, 
  bulkDeleteStudents, 
  exportStudentsExcel, 
  importStudentsExcel
} from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, getStudents);
router.get('/export/excel', protect, exportStudentsExcel);
router.post('/import/excel', protect, upload.single('file'), importStudentsExcel);
router.delete('/bulk-delete', protect, bulkDeleteStudents);
router.get('/:id', protect, getStudentById);
router.post('/', protect, createStudent);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, deleteStudent);

export default router;
