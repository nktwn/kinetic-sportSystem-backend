const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Event = sequelize.define('Event', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  class: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userIds: {
    type: DataTypes.TEXT, // Мы будем хранить JSON
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('userIds');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('userIds', JSON.stringify(value));
    }
  }
}, {
  timestamps: true
});

module.exports = Event;
