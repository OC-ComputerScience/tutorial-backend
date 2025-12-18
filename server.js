
import routes from "./app/routes/index.js";
import express, { json, urlencoded } from "express"
import cors from "cors";
import morgan from "morgan";

import db  from "./app/models/index.js";
import logger from "./app/config/logger.js";

db.sequelize.sync();

const app = express();

// HTTP request logger middleware
app.use(morgan('combined', { stream: logger.stream }));

// Also use the cors middleware as backup
var corsOptions = {
  origin: "http://localhost:8081",
  credentials: true
}
app.use(cors(corsOptions));


// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
  
// Load the routes from the routes folder
app.use("/tutorial", routes); 


// set port, listen for requests
const PORT = process.env.PORT || 3100;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

// Export logger for use in other modules
export { logger };

export default app;
