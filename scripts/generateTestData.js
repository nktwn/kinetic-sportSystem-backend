// const sequelize = require('../config/db');
// const User = require('../models/user');
// const Department = require('../models/Department');
// const bcrypt = require('bcryptjs');

// (async () => {
//   try {

//     await User.destroy({ where: {} });
//     await Department.destroy({ where: {} });

//     const [dep1, dep2, dep3] = await Promise.all([
//       Department.create({ name: 'Департамент 1', description: 'Департамент 1 Описание' }),
//       Department.create({ name: 'Департамент 2', description: 'Департамент 2 Описание' }),
//       Department.create({ name: 'Департамент 3', description: 'Департамент 3 Описание' }),
//     ]);

//     const usersData = [
//       {
//         username: 'user1',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000001',
//         full_name: 'Пользователь 1 (Департамент 1)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 1
//       },
//       {
//         username: 'user2',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000002',
//         full_name: 'Пользователь 2 (Департамент 1)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 1
//       },
//       {
//         username: 'user3',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000003',
//         full_name: 'Пользователь 3 (Департамент 1)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 1
//       },
//       {
//         username: 'user4',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000004',
//         full_name: 'Пользователь 4 (Департамент 2)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 2
//       },
//       {
//         username: 'user5',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000005',
//         full_name: 'Пользователь 5 (Департамент 2)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 2
//       },
//       {
//         username: 'user6',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000006',
//         full_name: 'Пользователь 6 (Департамент 2)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 2
//       },
//       {
//         username: 'user7',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000007',
//         full_name: 'Пользователь 7 (Департамент 3)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 3
//       },
//       {
//         username: 'user8',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000008',
//         full_name: 'Пользователь 8 (Департамент 3)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 3
//       },
//       {
//         username: 'user9',
//         password: await bcrypt.hash('1234', 10),
//         iin: '990000000009',
//         full_name: 'Пользователь 9 (Департамент 3)',
//         rank: 'Лейтенант',
//         role: 'employee',
//         departmentId: 3
//       },
//     ];

//     await User.bulkCreate(usersData);

//     console.log('Пользователи созданы');
//     process.exit(0);
//   } catch (error) {
//     console.error('Ошибка генерации тестовых данных', error);
//     process.exit(1);
//   }
// })();
