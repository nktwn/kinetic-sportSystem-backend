const express = require('express');
const Event = require('../models/event');
const { activityData } = require('./activitiesRoutes');
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/user');
const router = express.Router();
const Department = require('../models/department');
const { Sequelize } = require('sequelize');


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
      return res.status(400).json({ message: 'Время окончания должно быть позже времени начала' });
    }


    if (req.user.role === 'admin') {

      const adminDepartmentId = req.user.departmentId;
      if (!adminDepartmentId) {
        return res.status(400).json({ message: 'У админа не привязан департамент' });
      }
    
      const usersFromOtherDepartments = users.filter(user => user.departmentId !== adminDepartmentId);
      if (usersFromOtherDepartments.length > 0) {
        return res.status(400).json({ message: 'Админ может создавать события только для работников своего департамента' });
      }
    }

    const activityType = activityData.find(item => item.type === type);
    if (!activityType) {
      return res.status(400).json({ message: `Тип активности "${type}" не существует` });
    }
    if (!activityType.classes.includes(cls)) {
      return res.status(400).json({ message: `Класс "${cls}" не относится к типу "${type}"` });
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

    const overlappingEvents = await Event.findOne({
      where: {
        location,
        [Sequelize.Op.or]: [
          {
            startTime: { [Sequelize.Op.between]: [startTime, endTime] }
          },
          {
            endTime: { [Sequelize.Op.between]: [startTime, endTime] }
          },
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
      return res.status(400).json({ message: 'В выбранное время в этой локации уже запланировано другое событие' });
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

    res.status(201).json({
      message: 'Событие успешно создано',
      event
    });

  } catch (error) {
    console.error('Ошибка при создании события:', error);
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
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    if (req.user.role === 'admin') {
      if (!req.user.departmentId) {
        return res.status(400).json({ message: 'У админа нет привязанного департамента' });
      }
      if (event.departmentId !== req.user.departmentId) {
        return res.status(403).json({ message: 'Админ может редактировать только события своего департамента' });
      }
    }

    if (type || cls) {
      const effectiveType = type || event.type;
      const effectiveClass = cls || event.class;

      const activityType = activityData.find(item => item.type === effectiveType);
      if (!activityType) {
        return res.status(400).json({ message: `Тип активности "${effectiveType}" не существует` });
      }
      if (!activityType.classes.includes(effectiveClass)) {
        return res.status(400).json({ message: `Класс "${effectiveClass}" не относится к типу "${effectiveType}"` });
      }
    }

    if (userIds) {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'userIds должен быть массивом и не пустым' });
      }

      const users = await User.findAll({ where: { id: userIds } });

      if (users.length !== userIds.length) {
        return res.status(404).json({ message: 'Один или несколько пользователей не найдены' });
      }

      const uniqueDepartmentIds = [...new Set(users.map(u => u.departmentId))];
      if (uniqueDepartmentIds.length !== 1) {
        return res.status(400).json({ message: 'Все участники должны быть из одного департамента' });
      }

      if (req.user.role === 'admin' && uniqueDepartmentIds[0] !== req.user.departmentId) {
        return res.status(403).json({ message: 'Админ может указывать только сотрудников своего департамента' });
      }

      event.userIds = JSON.stringify(userIds);
    }

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start >= end) {
        return res.status(400).json({ message: 'Время окончания должно быть позже времени начала' });
      }

      const overlappingEvents = await Event.findOne({
        where: {
          id: { [Sequelize.Op.ne]: eventId },
          location: event.location,
          [Sequelize.Op.or]: [
            {
              startTime: { [Sequelize.Op.between]: [startTime, endTime] }
            },
            {
              endTime: { [Sequelize.Op.between]: [startTime, endTime] }
            },
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
        return res.status(400).json({ message: 'В выбранное время в этой локации уже запланировано другое событие' });
      }

      event.startTime = startTime;
      event.endTime = endTime;
    }

    event.title = title || event.title;
    event.type = type || event.type;
    event.class = cls || event.class;

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
