const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const EventRequest = require('../models/eventRequest');
const Event = require('../models/event');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только администратор может просматривать заявки' });
    }

    const requests = await EventRequest.findAll({
      where: { departmentId: req.user.departmentId, status: 'pending' }
    });

    res.json(requests);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении заявок' });
  }
});

router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только администратор может одобрять заявки' });
    }

    const request = await EventRequest.findByPk(req.params.id);
    if (!request || request.departmentId !== req.user.departmentId) {
      return res.status(404).json({ message: 'Запрос не найден или не принадлежит вашему департаменту' });
    }
    if (request.action === 'delete') {
      const event = await Event.findByPk(request.eventId);
      if (!event) {
        return res.status(404).json({ message: 'Событие для удаления не найдено' });
      }

      await request.destroy();

      await event.destroy();
      
      return res.json({ message: 'Запрос на удаление события одобрен и событие удалено' });
    }

    if (request.action === 'post') {
      await Event.create({
        title: request.title,
        startTime: request.startTime,
        endTime: request.endTime,
        location: request.location,
        type: request.type,
        class: request.class,
        userIds: JSON.stringify(request.userIds),
        departmentId: request.departmentId
      });
    }

    if (request.action === 'put') {
      const event = await Event.findByPk(request.eventId);
      if (!event) {
        return res.status(404).json({ message: 'Событие для обновления не найдено' });
      }

      event.title = request.title;
      event.startTime = request.startTime;
      event.endTime = request.endTime;
      event.location = request.location;
      event.type = request.type;
      event.class = request.class;
      event.userIds = JSON.stringify(request.userIds);

      await event.save();
    }

    await request.destroy();

    res.json({ message: 'Запрос успешно одобрен и удалён' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при одобрении запроса' });
  }
});


  

router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только администратор может отклонять заявки' });
    }

    const request = await EventRequest.findByPk(req.params.id);
    if (!request || request.departmentId !== req.user.departmentId) {
      return res.status(404).json({ message: 'Запрос не найден или не принадлежит вашему департаменту' });
    }

    await request.destroy();

    res.json({ message: 'Запрос успешно отклонён и удалён' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при отклонении запроса' });
  }
});
  
  

module.exports = router;
