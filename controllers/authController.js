const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Department = require('../models/department');
const dotenv = require('dotenv');
dotenv.config();

const allowedRanks = [
  'Рядовой', 'Ефрейтор', 'Младший сержант', 'Сержант', 'Старший сержант', 'Старшина',
  'Сержант третьего класса', 'Сержант второго класса', 'Сержант первого класса',
  'Штаб-сержант', 'Мастер-сержант', 'Лейтенант', 'Старший лейтенант', 'Капитан', 'Майор',
  'Подполковник', 'Полковник', 'Генерал-майор', 'Генерал-лейтенант', 'Генерал-полковник', 'Генерал армии'
];

const allowedRoles = ['admin', 'hr', 'employee'];

exports.register = async (req, res) => {
  const { username, password, iin, full_name, rank, role, position, departmentId } = req.body;

  try {
    if (!allowedRanks.includes(rank)) {
      return res.status(400).json({ message: 'Недопустимое звание' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }

    const existingUser = await User.findOne({ where: { iin } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким ИИН уже существует' });
    }

    if (departmentId !== undefined && departmentId !== null) {
      if (typeof departmentId !== 'number' || departmentId <= 0) {
        return res.status(400).json({ message: 'Неверный ID департамента' });
      }

      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(400).json({ message: 'Указанный департамент не найден' });
      }

      // Если регистрируем АДМИНА, проверяем есть ли уже админ
      if (role === 'admin') {
        if (department.adminId) {
          return res.status(400).json({ message: 'У департамента уже назначен администратор' });
        }
      }
    } else if (role === 'admin') {
      // Для админа департамент обязателен
      return res.status(400).json({ message: 'Администратор должен быть привязан к департаменту' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      iin,
      full_name,
      rank,
      position,
      role,
      departmentId: departmentId ?? null
    });

    // Если зарегистрировали админа, обновляем adminId в департаменте
    if (role === 'admin' && departmentId) {
      const department = await Department.findByPk(departmentId);
      department.adminId = user.id;
      await department.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при регистрации пользователя' });
  }
};


// Логин брат
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Неверные учетные данные' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      access_token: token,
      token_type: 'bearer',
      role: user.role 
    });

  } catch (error) {
    res.status(500).json({ message: 'Ошибка при входе в систему' });
  }
};


// Получение текущего пользователя брат
exports.getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      rank: user.rank,
      role: user.role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении пользователя' });
  }
};




// Обновление роли брат
exports.updateUserRole = async (req, res) => {
  const { new_role } = req.query;

  if (!new_role || !['admin', 'hr', 'employee'].includes(new_role)) {
    return res.status(400).json({ message: 'Недопустимая роль. Возможные роли: admin, hr, employee' });
  }

  try {
    const user = req.user;

    // Если пытаемся обновить на admin
    if (new_role === 'admin') {
      if (!user.departmentId) {
        return res.status(400).json({ message: 'Администратор должен быть привязан к департаменту' });
      }

      const department = await Department.findByPk(user.departmentId);

      if (!department) {
        return res.status(404).json({ message: 'Департамент пользователя не найден' });
      }

      if (department.adminId && department.adminId !== user.id) {
        return res.status(400).json({ message: 'У департамента уже назначен другой администратор' });
      }

      // Обновляем adminId если всё ок
      department.adminId = user.id;
      await department.save();
    }

    // Если пользователь был админом и меняет роль на другую — снять его из adminId департамента
    if (user.role === 'admin' && new_role !== 'admin') {
      const department = await Department.findByPk(user.departmentId);
      if (department && department.adminId === user.id) {
        department.adminId = null;
        await department.save();
      }
    }

    // Обновляем роль пользователя
    user.role = new_role;
    await user.save();

    res.json({ message: `Роль успешно обновлена на ${new_role}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при обновлении роли' });
  }
};
