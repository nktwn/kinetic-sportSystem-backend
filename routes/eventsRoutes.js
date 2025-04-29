const express = require('express');
const Event = require('../models/event');
const { activityData } = require('./activitiesRoutes');
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/user');
const router = express.Router();
const Department = require('../models/department');
const { Sequelize } = require('sequelize');



// Получение событий брат 
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
    // Найти пользователей
    const users = await User.findAll({
      where: { id: userIds }
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({ message: 'Один или несколько пользователей не найдены' });
    }

    // Проверка что конец позже начала
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ message: 'Время окончания должно быть позже времени начала' });
    }


    if (req.user.role === 'admin') {
      // Проверяем, что все пользователи из департамента админа
      const adminDepartmentId = req.user.departmentId;
      if (!adminDepartmentId) {
        return res.status(400).json({ message: 'У админа не привязан департамент' });
      }
    
      const usersFromOtherDepartments = users.filter(user => user.departmentId !== adminDepartmentId);
      if (usersFromOtherDepartments.length > 0) {
        return res.status(400).json({ message: 'Админ может создавать события только для работников своего департамента' });
      }
    }
    

    // Проверить, что все из одного департамента
    const uniqueDepartmentIds = [...new Set(users.map(u => u.departmentId))];
    if (uniqueDepartmentIds.length !== 1) {
      return res.status(400).json({ message: 'Все участники должны быть из одного департамента' });
    }

    const departmentId = uniqueDepartmentIds[0];

    // Получить локацию департамента
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Департамент не найден' });
    }

    const location = department.location;

    // Проверить наличие других событий в этой локации
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

    // Если admin - проверяем принадлежность события его департаменту
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

// Обновление события брат
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

    // Если admin - проверяем принадлежность события его департаменту
    if (req.user.role === 'admin' && event.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: 'Админ может редактировать только события своего департамента' });
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

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start >= end) {
        return res.status(400).json({ message: 'Время окончания должно быть позже времени начала' });
      }
    }

    if (userIds && (!Array.isArray(userIds) || userIds.length === 0)) {
      return res.status(400).json({ message: 'userIds должен быть массивом и не пустым' });
    }

    event.title = title || event.title;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
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
