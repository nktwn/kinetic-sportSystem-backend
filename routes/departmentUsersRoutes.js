const express = require('express');
const User = require('../models/user');
const router = express.Router();

router.get('/departments/:id/users', async (req, res) => {
  const departmentId = req.params.id;

  try {
    const users = await User.findAll({
      where: { departmentId },
      attributes: ['id', 'username', 'full_name', 'rank', 'role']
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'Нет пользователей в этом департаменте' });
    }

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении пользователей' });
  }
});

module.exports = router;
