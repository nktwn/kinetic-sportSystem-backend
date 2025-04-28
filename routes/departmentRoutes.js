const express = require('express');
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');

const router = express.Router();

router.post('/', createDepartment);

router.get('/', getAllDepartments);

router.get('/:id', getDepartmentById);
router.put('/:id', updateDepartment);

router.delete('/:id', deleteDepartment);

module.exports = router;
