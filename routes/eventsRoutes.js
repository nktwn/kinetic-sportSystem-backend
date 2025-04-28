const express = require('express');
const Event = require('../models/Event');
const User = require('../models/user');
const { activityData } = require('./activitiesRoutes');
const router = express.Router();

router.get('/', async (req, res) => {
  const events = await Event.findAll();
  res.json(events);
});


router.post('/', async (req, res) => {
  const { start, title, location, type, class: cls, userIds } = req.body;

  if (!start || !title || !location || !type || !cls || !Array.isArray(userIds)) {
    return res.status(400).json({ message: "Необходимо заполнить все поля и передать массив пользователей" });
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
      return res.status(400).json({ message: 'Не выбраны пользователи для создания событий' });
    }

    const users = await User.findAll({
      where: { id: userIds }
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ message: 'Один или несколько пользователей не найдены' });
    }

    const createdEvents = await Promise.all(
      users.map(user => Event.create({
        title,
        start,
        location,
        type,
        class: cls,
        userId: user.id
      }))
    );

    res.status(201).json(createdEvents);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при создании событий' });
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