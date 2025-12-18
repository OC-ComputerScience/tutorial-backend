import db  from "../models/index.js";
import logger from "../config/logger.js";

const Tutorial = db.tutorial;
const Op = db.Sequelize.Op;
const exports = {};
// Create and Save a new Tutorial
exports.create = (req, res) => {
  // Validate request
  if (!req.body.title) {
    logger.warn('Tutorial creation attempt with empty title');
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }
  // Create a Tutorial
  const tutorial = {
    title: req.body.title,
    description: req.body.description,
    published: req.body.published ? req.body.published : false,
    userId: req.body.userId,
  };
  
  logger.debug(`Creating tutorial: ${tutorial.title} for user: ${tutorial.userId}`);
  
  // Save Tutorial in the database
  Tutorial.create(tutorial)
    .then((data) => {
      logger.info(`Tutorial created successfully: ${data.id} - ${data.title}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating tutorial: ${err.message}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Tutorial.",
      });
    });
};
// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;
  
  logger.debug(`Fetching all tutorials with condition: ${JSON.stringify(condition)}`);
  
  Tutorial.findAll({ where: condition })
    .then((data) => {
      logger.info(`Retrieved ${data.length} tutorials`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving tutorials: ${err.message}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials.",
      });
    });
};

// Find a single Tutorial with an id
exports.findAllForUser = (req, res) => {
  const userId = req.params.userId;
  Tutorial.findAll({ where: { userId: userId } })
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Tutorials for user with id=${userId}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Error retrieving Tutorials for user with id=" + userId,
      });
    });
};
// Find a single Tutorial with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  logger.debug(`Finding tutorial with id: ${id}`);
  
  Tutorial.findByPk(id)
    .then((data) => {
      if (data) {
        logger.info(`Tutorial found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`Tutorial not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find Tutorial with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving tutorial ${id}: ${err.message}`);
      res.status(500).send({
        message: err.message || "Error retrieving Tutorial with id=" + id,
      });
    });
};
// Update a Tutorial by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  Tutorial.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Tutorial was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Error updating Tutorial with id=" + id,
      });
    });
};
// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  logger.debug(`Attempting to delete tutorial: ${id}`);
  
  Tutorial.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Tutorial ${id} deleted successfully`);
        res.send({
          message: "Tutorial was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete tutorial ${id} - not found`);
        res.send({
          message: `Cannot delete Tutorial with id=${id}. Maybe Tutorial was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting tutorial ${id}: ${err.message}`);
      res.status(500).send({
        message: err.message || "Could not delete Tutorial with id=" + id,
      });
    });
};

export default exports;