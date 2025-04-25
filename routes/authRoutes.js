const express = require('express');
const { register, login, getCurrentUser, updateUserRole } = require('../controllers/authController');
const router = express.Router();

// Регистрация
router.post('/register', register);

// Вход
router.post('/login', login);

// Получение данных о текущем пользователе
router.get('/me', getCurrentUser);

// Обновление роли пользователя
router.put('/update-role', updateUserRole);

module.exports = router;
