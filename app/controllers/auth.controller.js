import db  from "../models/index.js";
import authconfig  from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import  { google } from "googleapis";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

const User = db.user;
const Session = db.session;
const Op = db.Sequelize.Op;

let googleUser = {};

const google_id = process.env.CLIENT_ID;

const exports = {};

exports.login = async (req, res) => {
  logger.info('Login attempt initiated');

  var googleToken = req.body.credential;

  const client = new OAuth2Client(google_id);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    googleUser = ticket.getPayload();
    logger.debug(`Google authentication successful for email: ${googleUser.email}`);
  }
  await verify().catch((err) => {
    logger.error(`Google token verification failed: ${err.message}`);
  });

  let email = googleUser.email;
  let firstName = googleUser.given_name;
  let lastName = googleUser.family_name;

  // if we don't have their email or name, we need to make another request
  // this is solely for testing purposes
  if (
    (email === undefined ||
      firstName === undefined ||
      lastName === undefined) &&
    req.body.accessToken !== undefined
  ) {
    logger.debug('Fetching additional user info from Google API');
    let oauth2Client = new OAuth2Client(google_id); // create new auth client
    oauth2Client.setCredentials({ access_token: req.body.accessToken }); // use the new auth client with the access_token
    let oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    let { data } = await oauth2.userinfo.get(); // get user info
    logger.debug(`Retrieved user info from Google: ${data.email}`);
    email = data.email;
    firstName = data.given_name;
    lastName = data.family_name;
  }


  let user = {};
  let session = {};

  logger.debug(`Looking up user by email: ${email}`);
  
  await User.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data != null) {
        user = data.dataValues;
        logger.debug(`Existing user found: ${email}`);
      } else {
        // create a new User and save to database
        user = {
          fName: firstName,
          lName: lastName,
          email: email,
        };
        logger.debug(`New user to be created: ${email}`);
      }
    })
    .catch((err) => {
      logger.error(`Error finding user: ${err.message}`);
      res.status(500).send({ message: err.message });
      return;
    });

  // this lets us get the user id
  if (user.id === undefined) {
    logger.info(`Creating new user: ${user.email}`);
    
    await User.create(user)
      .then((data) => {
        user = data.dataValues;
        logger.info(`User registered successfully: ${user.id} - ${user.email}`);
      })
      .catch((err) => {
        logger.error(`Error creating user: ${err.message}`);
        res.status(500).send({ message: err.message });
        return;
      });
  } else {
    
    // doing this to ensure that the user's name is the one listed with Google
    user.fName = firstName;
    user.lName = lastName;
  
    await User.update(user, { where: { id: user.id } })
      .then((num) => {
        if (num == 1) {
          logger.info(`Updated user name: ${user.id}`);
        } else {
          logger.warn(`Cannot update user with id=${user.id}. User not found or empty body`);
        }
      })
      .catch((err) => {
        logger.error(`Error updating user ${user.id}: ${err.message}`);
      });
  }

  // try to find session first
  logger.debug(`Looking for existing session for: ${email}`);

  await Session.findOne({
    where: {
      email: email,
      token: { [Op.ne]: "" },
    },
  })
    .then(async (data) => {
      if (data !== null) {
        session = data.dataValues;
        if (session.expirationDate < Date.now()) {
          logger.info(`Session expired for ${email}, clearing token`);
          session.token = "";
          // clear session's token if it's expired
          await Session.update(session, { where: { id: session.id } })
            .then((num) => {
              if (num == 1) {
                logger.info('Expired session cleared successfully');
              } else {
                logger.error('Failed to clear expired session');
                res.send({
                  message: `Error logging out user.`,
                });
                return;
              }
            })
            .catch((err) => {
              logger.error(`Error clearing expired session: ${err.message}`);
              res.status(500).send({
                message: "Error logging out user.",
              });
              return;
            });
          //reset session to be null since we need to make another one
          session = {};
        } else {
          // if the session is still valid, then send info to the front end
          let userInfo = {
            email: user.email,
            fName: user.fName,
            lName: user.lName,
            userId: user.id,
            token: session.token,
            // refresh_token: user.refresh_token,
            // expiration_date: user.expiration_date
          };
          logger.info(`Valid session found for ${email}, reusing existing session`);
          res.send(userInfo);
          return;
        }
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving session: ${err.message}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
      return;
    });

  if (session.id === undefined) {
    // create a new Session with an expiration date and save to database
    logger.info(`Creating new session for ${email}`);
    let token = jwt.sign({ id: email }, authconfig.secret, {
      expiresIn: 86400,
    });
    let tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 1);
    const newSession = {
      token: token,
      email: email,
      userId: user.id,
      expirationDate: tempExpirationDate,
    };

    logger.debug(`Session created with expiration: ${tempExpirationDate}`);

    await Session.create(newSession)
      .then(() => {
        let userInfo = {
          email: user.email,
          fName: user.fName,
          lName: user.lName,
          userId: user.id,
          token: token,
          // refresh_token: user.refresh_token,
          // expiration_date: user.expiration_date
        };
        logger.info(`Login successful for user: ${user.email}`);
        res.send(userInfo);
      })
      .catch((err) => {
        logger.error(`Error creating session: ${err.message}`);
        res.status(500).send({ message: err.message });
      });
  }
};

exports.authorize = async (req, res) => {
  logger.info(`Authorization request for user: ${req.params.id}`);
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "postmessage"
  );

  logger.debug('Exchanging authorization code for tokens');
  // Get access and refresh tokens (if access_type is offline)
  let { tokens } = await oauth2Client.getToken(req.body.code);
  oauth2Client.setCredentials(tokens);

  let user = {};
  logger.debug(`Finding user with id: ${req.params.id}`);

  await User.findOne({
    where: {
      id: req.params.id,
    },
  })
    .then((data) => {
      if (data != null) {
        user = data.dataValues;
        logger.debug(`User found for authorization: ${user.email}`);
      } else {
        logger.warn(`User not found for authorization: ${req.params.id}`);
        res.status(404).send({ 
          message: `User with id ${req.params.id} not found` 
        });
        return;
      }
    })
    .catch((err) => {
      logger.error(`Error finding user for authorization: ${err.message}`);
      res.status(500).send({ message: err.message });
      return;
    });

  // Check if user was found before continuing
  if (!user.id) {
    return; // User not found, response already sent
  }
  
  user.refresh_token = tokens.refresh_token;
  let tempExpirationDate = new Date();
  tempExpirationDate.setDate(tempExpirationDate.getDate() + 100);
  user.expiration_date = tempExpirationDate;

  await User.update(user, { where: { id: user.id } })
    .then((num) => {
      if (num == 1) {
        logger.info(`Updated Google OAuth tokens for user: ${user.id}`);
      } else {
        logger.warn(`Cannot update user ${user.id}. User not found or empty body`);
      }
      let userInfo = {
        refresh_token: user.refresh_token,
        expiration_date: user.expiration_date,
      };
      res.send(userInfo);
    })
    .catch((err) => {
      logger.error(`Error updating user tokens: ${err.message}`);
      res.status(500).send({ message: err.message });
      return
    });

  logger.debug('Authorization complete');
};

exports.logout = async (req, res) => {
  logger.info('Logout request received');
  
  if (req.body === null) {
    logger.warn('Logout attempt with null body');
    res.send({
      message: "User has already been successfully logged out!",
    });
    return;
  }

  // invalidate session -- delete token out of session table
  let session = {};

  logger.debug('Looking up session for logout');
  await Session.findAll({ where: { token: req.body.token } })
    .then((data) => {
      if (data[0] !== undefined) {
        session = data[0].dataValues;
        logger.debug(`Session found for logout: ${session.email}`);
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving session for logout: ${err.message}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
      return;
    });

  session.token = "";

  // session won't be null but the id will if no session was found
  if (session.id !== undefined) {
    Session.update(session, { where: { id: session.id } })
      .then((num) => {
        if (num == 1) {
          logger.info(`User logged out successfully: ${session.email}`);
          res.send({
            message: "User has been successfully logged out!",
          });
        } else {
          logger.error('Failed to clear session token');
          res.send({
            message: `Error logging out user.`,
          });
        }
      })
      .catch((err) => {
        logger.error(`Error during logout: ${err.message}`);
        res.status(500).send({
          message: "Error logging out user.",
        });
      });
  } else {
    logger.warn('Logout attempt for already logged out user');
    res.send({
      message: "User has already been successfully logged out!",
    });
  }
};
export default exports;
