const express = require('express');
const Event = require('../models/event');
const { activityData } = require('./activitiesRoutes');
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/user');
const router = express.Router();
const Department = require('../models/department');
const { Sequelize } = require('sequelize');
const EventRequest = require('../models/eventRequest');



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

router.post('/', authenticate, async (req, res) => {
  const { startTime, endTime, title, type, class: cls, userIds } = req.body;

  if (!startTime || !endTime || !title || !type || !cls || !Array.isArray(userIds)) {
    return res.status(400).json({ message: "Все поля обязательны и userIds должен быть массивом" });
  }

  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Только HR или Admin могут создавать события' });
  }

  const activityType = activityData.find(item => item.type === type);
  if (!activityType) {
    return res.status(400).json({ message: `Тип активности "${type}" не существует` });
  }

  if (!activityType.classes.includes(cls)) {
    return res.status(400).json({ message: `Класс "${cls}" не относится к типу "${type}"` });
  }

  try {
    const users = await User.findAll({
      where: { id: userIds }
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ message: 'Один или несколько пользователей не найдены' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ message: 'Время окончания должно быть позже начала' });
    }

    const uniqueDepartmentIds = [...new Set(users.map(u => u.departmentId))];
    if (uniqueDepartmentIds.length !== 1) {
      return res.status(400).json({ message: 'Все пользователи должны быть из одного департамента' });
    }

    const departmentId = uniqueDepartmentIds[0];

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Департамент не найден' });
    }

    const location = department.location;

    const overlappingEvents = await Event.findOne({
      where: {
        location,
        [Sequelize.Op.or]: [
          { startTime: { [Sequelize.Op.between]: [startTime, endTime] } },
          { endTime: { [Sequelize.Op.between]: [startTime, endTime] } },
          { 
            [Sequelize.Op.and]: [
              { startTime: { [Sequelize.Op.lte]: startTime } },
              { endTime: { [Sequelize.Op.gte]: endTime } }
            ]
          }
        ]
      }
    });

    if (overlappingEvents) {
      return res.status(400).json({ message: 'Пересечение событий в выбранное время' });
    }

    if (req.user.role === 'admin') {
      if (!req.user.departmentId || req.user.departmentId !== departmentId) {
        return res.status(403).json({ message: 'Админ может работать только со своим департаментом' });
      }


      const event = await Event.create({
        title,
        startTime,
        endTime,
        location,
        type,
        class: cls,
        userIds: JSON.stringify(userIds),
        departmentId
      });

      return res.status(201).json({ message: 'Событие успешно создано', event });

    } else if (req.user.role === 'hr') {
      if (!department.adminId) {
        return res.status(400).json({ message: 'У департамента нет администратора' });
      }

      const eventRequest = await EventRequest.create({
        title,
        startTime,
        endTime,
        location,
        type,
        class: cls,
        userIds,
        departmentId,
        action: 'post',
        status: 'pending',
        eventId: null
      });

      return res.status(201).json({ message: 'Запрос на создание события отправлен админу', eventRequest });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при создании события' });
  }
});




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

    if (req.user.role === 'admin' && event.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: 'Админ может удалять только события своего департамента' });
    }

    await event.destroy();

    res.json({ message: 'Событие успешно удалено' });

  } catch (error) {
    console.error('Ошибка при удалении события:', error);
    res.status(500).json({ message: 'Ошибка при удалении события' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  const eventId = req.params.id;
  const { startTime, endTime, title, type, class: cls, userIds } = req.body;

  if (!['admin', 'hr'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Только HR или Admin могут редактировать события' });
  }

  try {
    const existingEvent = await Event.findByPk(eventId);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    if (req.user.role === 'admin') {
      if (!req.user.departmentId || req.user.departmentId !== existingEvent.departmentId) {
        return res.status(403).json({ message: 'Админ может редактировать только события своего департамента' });
      }
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds должен быть непустым массивом' });
    }

    const users = await User.findAll({ where: { id: userIds } });
    if (users.length !== userIds.length) {
      return res.status(404).json({ message: 'Один или несколько пользователей не найдены' });
    }

    if (users.some(user => user.departmentId !== existingEvent.departmentId)) {
      return res.status(400).json({
        message: 'Все выбранные пользователи должны принадлежать тому же департаменту, что и событие'
      });
    }

    const uniqueDepartmentIds = [...new Set(users.map(u => u.departmentId))];
    if (uniqueDepartmentIds.length !== 1) {
      return res.status(400).json({ message: 'Все участники должны быть из одного департамента' });
    }

    const departmentId = uniqueDepartmentIds[0];

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Департамент не найден' });
    }

    const location = department.location;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'Время окончания должно быть позже начала' });
    }

    const overlappingEvents = await Event.findOne({
      where: {
        id: { [Sequelize.Op.ne]: eventId },
        location,
        [Sequelize.Op.or]: [
          { startTime: { [Sequelize.Op.between]: [start, end] } },
          { endTime: { [Sequelize.Op.between]: [start, end] } },
          {
            [Sequelize.Op.and]: [
              { startTime: { [Sequelize.Op.lte]: start } },
              { endTime: { [Sequelize.Op.gte]: end } }
            ]
          }
        ]
      }
    });    

    if (overlappingEvents) {
      return res.status(400).json({ message: 'В выбранное время в этой локации уже есть событие' });
    }

    const activityType = activityData.find(item => item.type === type);
    if (!activityType || !activityType.classes.includes(cls)) {
      return res.status(400).json({ message: `Неверный тип или класс активности` });
    }

    if (req.user.role === 'hr') {
      if (!department.adminId) {
        return res.status(400).json({ message: 'У департамента нет администратора' });
      }

      await EventRequest.create({
        title,
        startTime,
        endTime,
        location,
        type,
        class: cls,
        userIds,
        departmentId,
        action: 'put',
        status: 'pending',
        eventId: parseInt(eventId)
      });

      return res.status(201).json({ message: 'Запрос на обновление события отправлен админу' });
    }


    existingEvent.title = title;
    existingEvent.startTime = start;
    existingEvent.endTime = end;
    existingEvent.location = location;
    existingEvent.type = type;
    existingEvent.class = cls;
    existingEvent.userIds = JSON.stringify(userIds);

    await existingEvent.save();

    res.json({ message: 'Событие успешно обновлено', event: existingEvent });

  } catch (error) {
    console.error('Ошибка при обновлении события:', error);
    res.status(500).json({ message: 'Ошибка при обновлении события' });
  }
});




module.exports = router;
