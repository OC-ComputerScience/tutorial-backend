import db  from "../models/index.js";
import logger from "../config/logger.js";

const Lesson = db.lesson;
const Op = db.Sequelize.Op;
const exports = {};
// Create and Save a new Lesson
exports.create = (req, res) => {
  // Validate request
  if (!req.body.title) {
    logger.warn('Lesson creation attempt with empty title');
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a Lesson
  const lesson = {
    tutorialId: req.params.tutorialId,
    title: req.body.title,
    description: req.body.description,
    published: req.body.published ? req.body.published : false,
  };
  
  logger.debug(`Creating lesson: ${lesson.title} for tutorial: ${lesson.tutorialId}`);
  
  // Save Lesson in the database
  Lesson.create(lesson)
    .then((data) => {
      logger.info(`Lesson created successfully: ${data.id} - ${data.title}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating lesson: ${err.message}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Lesson.",
      });
    });
};
// Retrieve all Lessons from the database.
exports.findAll = (req, res) => {
  const lessonId = req.query.lessonId;
  var condition = lessonId
    ? {
        lessonId: {
          [Op.like]: `%${lessonId}%`,
        },
      }
    : null;

  logger.debug(`Fetching all lessons with condition: ${JSON.stringify(condition)}`);

  Lesson.findAll({ where: condition })
    .then((data) => {
      logger.info(`Retrieved ${data.length} lessons`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving lessons: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving lessons.",
      });
    });
};
// Retrieve all Lessons for a tutorial from the database.
exports.findAllForTutorial = (req, res) => {
  const tutorialId = req.params.tutorialId;

  Lesson.findAll({ where: { tutorialId: tutorialId } })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving lessons.",
      });
    });
};
// Find a single Lesson with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  logger.debug(`Finding lesson with id: ${id}`);
  
  Lesson.findByPk(id)
    .then((data) => {
      if (data) {
        logger.info(`Lesson found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`Lesson not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find Lesson with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving lesson ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Lesson with id=" + id,
      });
    });
};
// Update a Lesson by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  logger.debug(`Updating lesson ${id} with data: ${JSON.stringify(req.body)}`);
  
  Lesson.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Lesson ${id} updated successfully`);
        res.send({
          message: "Lesson was updated successfully.",
        });
      } else {
        logger.warn(`Failed to update lesson ${id} - not found or empty body`);
        res.send({
          message: `Cannot update Lesson with id=${id}. Maybe Lesson was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating lesson ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error updating Lesson with id=" + id,
      });
    });
};
// Delete a Lesson with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  logger.debug(`Attempting to delete lesson: ${id}`);
  
  Lesson.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Lesson ${id} deleted successfully`);
        res.send({
          message: "Lesson was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete lesson ${id} - not found`);
        res.send({
          message: `Cannot delete Lesson with id=${id}. Maybe Lesson was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting lesson ${id}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete Lesson with id=" + id,
      });
    });
};

// Find all published Lessons
exports.findAllPublished = (req, res) => {
  const lessonId = req.query.lessonId;

  Lesson.findAll({ where: { published: true } })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving lessons.",
      });
    });
};

export default exports;
