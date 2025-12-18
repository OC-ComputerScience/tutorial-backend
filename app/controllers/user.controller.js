import db  from "../models/index.js";
import logger from "../config/logger.js";

const User = db.user;
const Op = db.Sequelize.Op;
const exports = {};
// Create and Save a new User
exports.create = (req, res) => {
  // Validate request
  if (!req.body.fName) {
    logger.warn('User creation attempt with empty fName');
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a User
  const user = {
    id: req.body.id,
    fName: req.body.fName,
    lName: req.body.lName,
    email: req.body.email,
    // refresh_token: req.body.refresh_token,
    // expiration_date: req.body.expiration_date
  };

  logger.debug(`Creating user: ${user.email}`);

  // Save User in the database
  User.create(user)
    .then((data) => {
      logger.info(`User created successfully: ${data.id} - ${data.email}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating user: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};

// Retrieve all People from the database.
exports.findAll = (req, res) => {
  const id = req.query.id;
  var condition = id ? { id: { [Op.like]: `%${id}%` } } : null;

  logger.debug(`Fetching all users with condition: ${JSON.stringify(condition)}`);

  User.findAll({ where: condition })
    .then((data) => {
      logger.info(`Retrieved ${data.length} users`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving users: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving people.",
      });
    });
};

// Find a single User with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding user with id: ${id}`);

  User.findByPk(id)
    .then((data) => {
      if (data) {
        logger.info(`User found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`User not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find User with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving user ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving User with id=" + id,
      });
    });
};

// Find a single User with an email
exports.findByEmail = (req, res) => {
  const email = req.params.email;

  logger.debug(`Finding user with email: ${email}`);

  User.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data) {
        logger.info(`User found by email: ${email}`);
        res.send(data);
      } else {
        logger.warn(`User not found with email: ${email}`);
        res.send({ email: "not found" });
        /*res.status(404).send({
          message: `Cannot find User with email=${email}.`
        });*/
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving user by email ${email}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving User with email=" + email,
      });
    });
};

// Update a User by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating user ${id} with data: ${JSON.stringify(req.body)}`);

  User.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`User ${id} updated successfully`);
        res.send({
          message: "User was updated successfully.",
        });
      } else {
        logger.warn(`Failed to update user ${id} - not found or empty body`);
        res.send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating user ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error updating User with id=" + id,
      });
    });
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  logger.debug(`Attempting to delete user: ${id}`);

  User.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`User ${id} deleted successfully`);
        res.send({
          message: "User was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete user ${id} - not found`);
        res.send({
          message: `Cannot delete User with id=${id}. Maybe User was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting user ${id}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete User with id=" + id,
      });
    });
};


export default exports;
