console.log("Delta model loaded");

const { DataTypes } = require("sequelize");
const sequelize = require("../baza");

const Delta = sequelize.define("Delta", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lineId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  nextLineId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  oldName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  newName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Delta;
