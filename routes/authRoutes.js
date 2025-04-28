const express = require('express');
const { register, login, getCurrentUser, updateUserRole } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.get('/me', getCurrentUser);

router.put('/update-role', updateUserRole);

module.exports = router;
