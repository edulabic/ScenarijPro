console.log("Checkpoint model loaded");

const { DataTypes } = require("sequelize");
const sequelize = require("../baza");

const Checkpoint = sequelize.define("Checkpoint", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timestamp: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Checkpoint;
