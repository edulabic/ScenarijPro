const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME || "wt26",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "password",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false
  }
);
module.exports = sequelize;
