const express = require('express');
const { register, login, getCurrentUser, updateUserRole } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// 🛡️ Здесь важно! Сначала authenticate, потом getCurrentUser
router.get('/me', authenticate, getCurrentUser);
router.put('/update-role', authenticate, updateUserRole);

module.exports = router;
