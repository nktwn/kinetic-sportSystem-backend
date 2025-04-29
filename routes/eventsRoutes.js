const express = require('express');
const Event = require('../models/event');
const { activityData } = require('./activitiesRoutes');
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/user');
const router = express.Router();

// Получение событий брат 
router.get('/', authenticate, async (req, res) => {
  try {
    let events;

    if (['admin', 'hr'].includes(req.user.role)) {
      events = await Event.findAll({ where: { status: 'approved' } });
    } else if (req.user.role === 'employee') {
      const allEvents = await Event.findAll({ where: { status: 'approved' } });
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

// Создание события брат
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
      userIds: JSON.stringify(userIds),
      status: req.user.role === 'hr' ? 'pending' : 'approved'
    });

    res.status(req.user.role === 'hr' ? 202 : 201).json({
      message: req.user.role === 'hr' 
        ? 'Событие отправлено на одобрение администратору' 
        : 'Событие успешно создано',
      event
    });

  } catch (error) {
    console.error('Ошибка при создании события:', error);
    res.status(500).json({ message: 'Ошибка при создании события' });
  }
});


// Удаление события брат
router.delete('/:id', authenticate, async (req, res) => {
  const eventId = req.params.id;

  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Только HR или Admin могут удалять события' });
  }

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    await event.destroy();

    res.json({ message: 'Событие успешно удалено' });

  } catch (error) {
    console.error('Ошибка при удалении события:', error);
    res.status(500).json({ message: 'Ошибка при удалении события' });
  }
});

// Обновление события брат
router.put('/:id', authenticate, async (req, res) => {
  const eventId = req.params.id;
  const { start, title, location, type, class: cls, userIds } = req.body;

  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Только HR или Admin могут редактировать события' });
  }

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    if (type || cls) {
      const activityType = activityData.find(item => item.type === (type || event.type));
      if (!activityType) {
        return res.status(400).json({ message: `Тип активности "${type || event.type}" не существует` });
      }
      if (cls && !activityType.classes.includes(cls)) {
        return res.status(400).json({ message: `Класс "${cls}" не относится к типу "${type || event.type}"` });
      }
    }

    if (userIds && (!Array.isArray(userIds) || userIds.length === 0)) {
      return res.status(400).json({ message: 'userIds должен быть массивом и не пустым' });
    }

    event.title = title || event.title;
    event.start = start || event.start;
    event.location = location || event.location;
    event.type = type || event.type;
    event.class = cls || event.class;
    if (userIds) {
      event.userIds = JSON.stringify(userIds);
    }

    await event.save();

    res.json({
      message: 'Событие успешно обновлено',
      event
    });

  } catch (error) {
    console.error('Ошибка при обновлении события:', error);
    res.status(500).json({ message: 'Ошибка при обновлении события' });
  }
});



module.exports = router;
