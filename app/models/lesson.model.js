import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Lesson = SequelizeInstance.define("lesson", {
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

export default Lesson;
