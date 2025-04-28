const express = require('express');
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');

const router = express.Router();

// Создать департамент
router.post('/', createDepartment);

// Получить все департаменты
router.get('/', getAllDepartments);

// Получить один департамент по id
router.get('/:id', getDepartmentById);

// Обновить департамент
router.put('/:id', updateDepartment);

// Удалить департамент
router.delete('/:id', deleteDepartment);

module.exports = router;
