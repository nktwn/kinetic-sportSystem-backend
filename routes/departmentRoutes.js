const express = require('express');
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, createDepartment);
router.get('/', authenticate, getAllDepartments);
router.get('/:id', authenticate, getDepartmentById);
router.put('/:id', authenticate, updateDepartment);
router.delete('/:id', authenticate, deleteDepartment);

module.exports = router;
