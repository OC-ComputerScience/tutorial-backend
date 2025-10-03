import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Tutorial = SequelizeInstance.define("tutorial", {
    title: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    published: {
      type: Sequelize.BOOLEAN,
    },
  });
   
export default Tutorial;
