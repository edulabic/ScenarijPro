const { DataTypes } = require("sequelize");
const sequelize = require("../baza");

const Line = sequelize.define("Line", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lineId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  nextLineId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Line;
