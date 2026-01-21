console.log("Scenario model loaded");

const { DataTypes } = require("sequelize");
const sequelize = require("../baza");

const Scenario = sequelize.define("Scenario", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Scenario;
