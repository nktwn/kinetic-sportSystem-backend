const Department = require('../models/department');
const User = require('../models/user');

// Вспомогательная проверка роли брат
const checkAdminOrHR = (user) => {
  return user.role === 'admin' || user.role === 'hr';
};

// Создание Департамента брат
exports.createDepartment = async (req, res) => {
  const { name, description } = req.body;

  if (!checkAdminOrHR(req.user)) {
    return res.status(403).json({ message: 'Недостаточно прав для создания департамента' });
  }

  try {
    const department = await Department.create({ name, description });
    res.status(201).json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при создании департамента' });
  }
};

// Получение всех департаментов брат
exports.getAllDepartments = async (req, res) => {
  if (!checkAdminOrHR(req.user)) {
    return res.status(403).json({ message: 'Недостаточно прав для просмотра департаментов' });
  }

  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении департаментов' });
  }
};

// Получение Департамента по ID брат
exports.getDepartmentById = async (req, res) => {
  const { id } = req.params;

  if (!checkAdminOrHR(req.user)) {
    return res.status(403).json({ message: 'Недостаточно прав для просмотра департамента' });
  }

  try {
    const department = await Department.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'username', 'full_name', 'rank', 'role'] }]
    });

    if (!department) {
      return res.status(404).json({ message: 'Департамент не найден' });
    }

    res.json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении департамента' });
  }
};

// Редактирование Департамента брат
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!checkAdminOrHR(req.user)) {
    return res.status(403).json({ message: 'Недостаточно прав для редактирования департамента' });
  }

  try {
    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({ message: 'Департамент не найден' });
    }

    department.name = name || department.name;
    department.description = description || department.description;

    await department.save();

    res.json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при обновлении департамента' });
  }
};

// Удаление Департамента брат
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  if (!checkAdminOrHR(req.user)) {
    return res.status(403).json({ message: 'Недостаточно прав для удаления департамента' });
  }

  try {
    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({ message: 'Департамент не найден' });
    }

    await department.destroy();
    res.json({ message: 'Департамент успешно удален' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при удалении департамента' });
  }
};
