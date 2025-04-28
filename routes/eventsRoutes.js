const express = require('express');
const Event = require('../models/event');
const { activityData } = require('./activitiesRoutes');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let events;

    if (['admin', 'hr'].includes(req.user.role)) {
      events = await Event.findAll();
    } else if (req.user.role === 'employee') {
      const allEvents = await Event.findAll();
      const userId = req.user.id;

      events = allEvents.filter(event => {
        const userIds = event.userIds || [];
        return userIds.includes(userId);
      });
    } else {
      return res.status(403).json({ message: 'Недостаточно прав для просмотра событий' });
    }

    res.json(events);

  } catch (error) {
    console.error('Ошибка при получении событий:', error);
    res.status(500).json({ message: 'Ошибка при получении событий' });
  }
});


const User = require('../models/user');

router.post('/', authenticate, async (req, res) => {
  const { start, title, location, type, class: cls, userIds } = req.body;

  if (!start || !title || !location || !type || !cls || !Array.isArray(userIds)) {
    return res.status(400).json({ message: "Все поля обязательны и userIds должен быть массивом" });
  }

  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Только HR или Admin могут создавать события' });
  }

  try {
    const activityType = activityData.find(item => item.type === type);
    if (!activityType) {
      return res.status(400).json({ message: `Тип активности "${type}" не существует` });
    }

    if (!activityType.classes.includes(cls)) {
      return res.status(400).json({ message: `Класс "${cls}" не относится к типу "${type}"` });
    }

    if (userIds.length === 0) {
      return res.status(400).json({ message: 'Выберите хотя бы одного пользователя' });
    }

    const users = await User.findAll({
      where: { id: userIds }
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ message: 'Один или несколько пользователей не найдены' });
    }

    const event = await Event.create({
      title,
      start,
      location,
      type,
      class: cls,
      userIds: JSON.stringify(userIds)
    });

    res.status(201).json(event);

  } catch (error) {
    console.error('Ошибка при создании события:', error);
    res.status(500).json({ message: 'Ошибка при создании события' });
  }
});


router.delete('/:id', authenticate, async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    await event.destroy();
    res.json({ message: 'Событие успешно удалено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при удалении события' });
  }
});

  

  router.delete('/:id', async (req, res) => {
    const eventId = req.params.id;
  
    try {
      const event = await Event.findByPk(eventId);
  
      if (!event) {
        return res.status(404).json({ message: 'Зачёт не найден' });
      }
  
      await event.destroy();
      res.json({ message: 'Зачёт успешно удален' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Ошибка при удалении зачёта' });
    }
  });
  
  module.exports = router;