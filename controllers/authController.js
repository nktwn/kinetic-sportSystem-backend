const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Department = require('../models/Department');
const dotenv = require('dotenv');
dotenv.config();


exports.register = async (req, res) => {
  const { username, password, iin, full_name, rank, role, departmentId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Проверяем, существует ли переданный департамент (если передали)
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

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      access_token: token,
      token_type: 'bearer',
      role: user.role 
    });

  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};
  
exports.getCurrentUser = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      rank: user.rank,
      role: user.role
    });
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

exports.getCurrentUser = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      rank: user.rank,
      role: user.role
    });
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};


exports.updateUserRole = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  const { new_role } = req.query;

  if (!new_role || !['admin', 'hr', 'employee'].includes(new_role)) {
    return res.status(400).json({ message: 'Invalid role. Valid roles are: admin, hr, employee' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin' && user.id !== decoded.id) {
      return res.status(403).json({ message: 'You do not have permission to update this role' });
    }

    user.role = new_role;
    await user.save(); 

    res.json({ message: `Role updated to ${new_role}` });

  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};
