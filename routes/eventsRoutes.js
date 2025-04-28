const express = require('express');
const Event = require('../models/Event');
const { activityData } = require('./activitiesRoutes');
const router = express.Router();

router.get('/', async (req, res) => {
  const events = await Event.findAll();
  res.json(events);
});

router.post('/', async (req, res) => {
    const { title, start, location, type, class: cls } = req.body;
  
    if (!title || !start || !location || !type || !cls) {
      return res.status(400).json({ message: "Все поля обязательны" });
    }
    
    const activityType = activityData.find(item => item.type === type);
    if (!activityType) {
      return res.status(400).json({ message: `Тип "${type}" не существует` });
    }
  
    if (!activityType.classes.includes(cls)) {
      return res.status(400).json({ message: `Класс "${cls}" не принадлежит типу "${type}"` });
    }
  
    try {
      const newEvent = await Event.create({
        title,
        start,
        location,
        type,
        class: cls
      });
      res.status(201).json(newEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Ошибка при создании зачёта' });
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