const express = require('express');
const router = express.Router();

const activityData = [
  {
    type: "Сила",
    classes: ["Отжимания", "Подтягивания", "Приседания", "Жим лежа", "Тяга"]
  },
  {
    type: "Выносливость",
    classes: ["Бег", "Плавание", "Велоспорт", "Гребля", "Скакалка"]
  },
  {
    type: "Гибкость",
    classes: ["Йога", "Стретчинг", "Пилатес"]
  },
  {
    type: "Кардио",
    classes: ["Беговая дорожка", "Эллиптический тренажер", "Велотренажер", "Групповые кардио тренировки"]
  },
  {
    type: "Реабилитация",
    classes: ["Физиотерапия", "Растяжка", "Массаж", "Упражнения для суставов"]
  }
];

router.get('/types', (req, res) => {
  const types = activityData.map((item, index) => ({
    id: index + 1,
    name: item.type
  }));
  res.json(types);
});

router.get('/types/:id/classes', (req, res) => {
  const typeIndex = parseInt(req.params.id, 10) - 1;
  const typeEntry = activityData[typeIndex];

  if (!typeEntry) {
    return res.status(404).json({ message: 'Тип занятия не найден' });
  }

  const classes = typeEntry.classes.map((cls, i) => ({
    id: `${req.params.id}${i + 1}`,
    name: cls
  }));

  res.json(classes);
});

module.exports = {
    router,
    activityData 
  };
