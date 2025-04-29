const express = require('express');
const Department = require('../models/department');
const Event = require('../models/event');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/requests', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Только админ может просматривать запросы' });

  try {
    const pendingDepartments = await Department.findAll({ where: { status: 'pending' } });
    const pendingEvents = await Event.findAll({ where: { status: 'pending' } });

    res.json({
      departments: pendingDepartments,
      events: pendingEvents
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении запросов' });
  }
});

router.put('/requests/:type/:id/evaluate', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Только админ может одобрять/отклонять' });

  const { type, id } = req.params;
  const { action } = req.query;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Действие должно быть approve или reject' });
  }

  try {
    let entity;
    if (type === 'department') {
      entity = await Department.findByPk(id);
    } else if (type === 'event') {
      entity = await Event.findByPk(id);
    } else {
      return res.status(400).json({ message: 'Неверный тип: department или event' });
    }

    if (!entity) {
      return res.status(404).json({ message: 'Объект не найден' });
    }

    if (action === 'approve') {
      entity.status = 'approved';
      await entity.save();
      return res.json({ message: `${type} одобрен` });
    } else {
      await entity.destroy();
      return res.json({ message: `${type} отклонен и удален` });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при обработке запроса' });
  }
});

module.exports = router;

router.get('/requests', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Только админ может просматривать запросы' });

  try {
    const pendingDepartments = await Department.findAll({ where: { status: 'pending' } });
    const pendingEvents = await Event.findAll({ where: { status: 'pending' } });
    const editingEvents = await EventEditRequest.findAll({ where: { status: 'pending' } });

    res.json({
      departments: pendingDepartments,
      events: pendingEvents,
      editingEvents: editingEvents
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении запросов' });
  }
});
