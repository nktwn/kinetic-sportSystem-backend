// const sequelize = require('../config/db');
// const User = require('../models/user');
// const Department = require('../models/department');
// const Event = require('../models/event'); // Добавляем Event
// const bcrypt = require('bcryptjs');

// (async () => {
//   try {
//     // Пересоздание всех таблиц: User, Department, Event
//     await sequelize.sync({ force: true });
//     console.log('База очищена и пересоздана');

//     // Создание департаментов
//     const dep1 = await Department.create({
//       name: 'Департамент внешней разведки',
//       description: 'Специализируется на сборе и анализе информации за рубежом, которая может повлиять на национальную безопасность Казахстана.'
//     });

//     const dep2 = await Department.create({
//       name: 'Департамент контрразведки',
//       description: 'Отвечает за выявление, пресечение и нейтрализацию деятельности иностранных разведок на территории РК.'
//     });

//     const dep3 = await Department.create({
//       name: 'Департамент кибербезопасности',
//       description: 'Защищает государственные информационные системы от внешних и внутренних киберугроз.'
//     });

//     // Админы (сначала создаём админов чтобы привязать их к департаментам)
//     const admin1 = await User.create({
//       username: 'batyr',
//       password: await bcrypt.hash('1234', 10),
//       iin: '111111111111',
//       full_name: 'Батыр Ашим',
//       rank: 'Полковник',
//       position: 'Начальник департамента',
//       role: 'admin',
//       departmentId: dep1.id
//     });

//     const admin2 = await User.create({
//       username: 'nurik',
//       password: await bcrypt.hash('1234', 10),
//       iin: '222222222221',
//       full_name: 'Нурхат Сергазиев',
//       rank: 'Полковник',
//       position: 'Начальник департамента',
//       role: 'admin',
//       departmentId: dep2.id
//     });

//     const admin3 = await User.create({
//       username: 'dias',
//       password: await bcrypt.hash('1234', 10),
//       iin: '333333333331',
//       full_name: 'Имаканов Диас',
//       rank: 'Полковник',
//       position: 'Начальник департамента',
//       role: 'admin',
//       departmentId: dep3.id
//     });

//     // Привязка админов к департаментам
//     dep1.adminId = admin1.id;
//     await dep1.save();

//     dep2.adminId = admin2.id;
//     await dep2.save();

//     dep3.adminId = admin3.id;
//     await dep3.save();

//     // Обычные сотрудники (капитаны и майоры)
//     const usersData = [
//       {
//         username: 'rodi',
//         password: await bcrypt.hash('1234', 10),
//         iin: '111111111112',
//         full_name: 'Родион',
//         rank: 'Майор',
//         position: 'Frontend разработчик',
//         role: 'hr',
//         departmentId: dep1.id
//       },
//       {
//         username: 'tair',
//         password: await bcrypt.hash('1234', 10),
//         iin: '111111111113',
//         full_name: 'Таирлан',
//         rank: 'Лейтенант',
//         position: 'Frontend разработчик',
//         role: 'employee',
//         departmentId: dep1.id
//       },
//       {
//         username: 'aldik',
//         password: await bcrypt.hash('1234', 10),
//         iin: '222222222222',
//         full_name: 'Алдияр',
//         rank: 'Майор',
//         position: 'DevOps инженер',
//         role: 'hr',
//         departmentId: dep2.id
//       },
//       {
//         username: 'sultiok',
//         password: await bcrypt.hash('1234', 10),
//         iin: '222222222223',
//         full_name: 'Султанияр',
//         rank: 'Лейтенант',
//         position: 'Fullstack разработчик',
//         role: 'employee',
//         departmentId: dep2.id
//       },
//       {
//         username: 'sula',
//         password: await bcrypt.hash('1234', 10),
//         iin: '333333333332',
//         full_name: 'Султан',
//         rank: 'Майор',
//         position: 'Backend разработчик',
//         role: 'hr',
//         departmentId: dep3.id
//       },
//       {
//         username: 'ernar',
//         password: await bcrypt.hash('1234', 10),
//         iin: '333333333333',
//         full_name: 'Ернар',
//         rank: 'Лейтенант',
//         position: 'Backend разработчик',
//         role: 'employee',
//         departmentId: dep3.id
//       }
//     ];

//     await User.bulkCreate(usersData);

//     console.log('Тестовые департаменты, пользователи и очищенные события успешно созданы');
//     process.exit(0);

//   } catch (error) {
//     console.error('Ошибка генерации тестовых данных', error);
//     process.exit(1);
//   }
// })();

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Event = require('../models/event');

(async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    // 1. Добавляем поля startTime, endTime, departmentId, если их нет
    const tableDescription = await queryInterface.describeTable('Events');

    if (!tableDescription.startTime) {
      await queryInterface.addColumn('Events', 'startTime', {
        type: DataTypes.DATE,
        allowNull: true,
      });
      console.log('Добавлено поле startTime');
    }

    if (!tableDescription.endTime) {
      await queryInterface.addColumn('Events', 'endTime', {
        type: DataTypes.DATE,
        allowNull: true,
      });
      console.log('Добавлено поле endTime');
    }

    if (!tableDescription.departmentId) {
      await queryInterface.addColumn('Events', 'departmentId', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
      console.log('Добавлено поле departmentId');
    }

    // 2. Переносим данные start → startTime
    const events = await Event.findAll();
    for (const event of events) {
      if (event.start) {
        event.startTime = event.start;
        await event.save();
        console.log(`Перенос start для события ID ${event.id}`);
      }
    }

    // 3. Удаляем старое поле start
    if (tableDescription.start) {
      await queryInterface.removeColumn('Events', 'start');
      console.log('Удалено поле start');
    }

    console.log('Миграция Events завершена успешно 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка миграции Events:', error);
    process.exit(1);
  }
})();
