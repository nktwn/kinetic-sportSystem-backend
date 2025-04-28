const Department = require('../models/department');
const User = require('../models/user');

exports.createDepartment = async (req, res) => {
  const { name, description } = req.body;

  try {
    const department = await Department.create({ name, description });
    res.status(201).json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при создании департамента' });
  }
};

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении департаментов' });
  }
};

exports.getDepartmentById = async (req, res) => {
  const { id } = req.params;

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

exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

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

exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

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
