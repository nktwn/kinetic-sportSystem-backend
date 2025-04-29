const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const Department = sequelize.define('Department', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

Department.belongsTo(User, { as: 'admin', foreignKey: 'adminId' });
User.hasOne(Department, { foreignKey: 'adminId', as: 'adminDepartment' });

Department.hasMany(User, { foreignKey: 'departmentId' });
User.belongsTo(Department, { foreignKey: 'departmentId' });

module.exports = Department;
