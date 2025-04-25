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
      res.status(500).json({ message: 'Ошибка при создании события' });
    }
  });
  
  module.exports = router;
