import db  from "../models/index.js";
import logger from "../config/logger.js";

const Session = db.session;

const authenticate = (req, res, next) => {
  let token = null;
 
  let authHeader = req.get("authorization");
  if (authHeader != null) {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);

      Session.findAll({ where: { token: token } })
        .then((data) => {
          let session = data[0];
          if (session != null) {
            logger.debug(`Token validation - expiration: ${session.expirationDate}`);
            if (session.expirationDate >= Date.now()) {
              logger.debug('Token valid, authentication successful');
              next();
              return;
            } else {
              logger.warn('Authentication failed: expired token');
              return res.status(401).send({
                message: "Unauthorized! Expired Token, Logout and Login again",
              });
            }
          } else {
            logger.warn('Authentication failed: session not found');
            return res.status(401).send({
              message: "Unauthorized! Invalid token",
            });
          }
        })
        .catch((err) => {
          logger.error(`Authentication error: ${err.message}`);
          return res.status(500).send({
            message: "Error during authentication",
          });
        });
    } else {
      logger.warn('Authentication failed: invalid authorization format (must be Bearer token)');
      return res.status(401).send({
        message: "Unauthorized! Invalid authorization format. Expected 'Bearer <token>'",
      });
    }
  } else {
    logger.warn('Authentication failed: no authorization header');
    return res.status(401).send({
      message: "Unauthorized! No Auth Header",
    });
  }
};



export default authenticate;
