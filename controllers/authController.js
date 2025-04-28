const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Department = require('../models/department');
const dotenv = require('dotenv');
dotenv.config();

// Регистрация брат
exports.register = async (req, res) => {
  const { username, password, iin, full_name, rank, role, departmentId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (departmentId) {
      const departmentExists = await Department.findByPk(departmentId);
      if (!departmentExists) {
        return res.status(400).json({ message: 'Указанный департамент не найден' });
      }
    }

    const user = await User.create({
      username,
      password: hashedPassword,
      iin,
      full_name,
      rank,
      role,
      departmentId: departmentId || null
    });

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


    user.role = new_role;
    await user.save();

    res.json({ message: `Роль обновлена на ${new_role}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при обновлении роли' });
  }
};
