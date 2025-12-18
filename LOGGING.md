# Logging Configuration

This project uses **Winston** for application logging and **Morgan** for HTTP request logging.

## Overview

The logging system provides:

- **Colored console output** for development
- **File-based logging** for production
- **HTTP request logging** via Morgan
- **Multiple log levels** (error, warn, info, http, debug)
- **Automatic log file rotation** (if needed)

## Log Levels

The application uses the following log levels:

| Level   | Priority | Usage                                               |
| ------- | -------- | --------------------------------------------------- |
| `error` | 0        | Critical errors that need immediate attention       |
| `warn`  | 1        | Warning messages for potentially harmful situations |
| `info`  | 2        | General informational messages                      |
| `http`  | 3        | HTTP request/response logging                       |
| `debug` | 4        | Detailed debug information                          |

## Log Files

Logs are stored in the `logs/` directory with **daily rotation**:

- **`error-YYYY-MM-DD.log`** - Contains only error-level messages for that day
- **`all-YYYY-MM-DD.log`** - Contains all log messages for that day
- **`*.log.gz`** - Compressed archives of older logs

### Rotation Settings

- **New file created**: Daily (at midnight)
- **Max file size**: 20MB (creates new file if exceeded)
- **Retention**: 14 days (older logs automatically deleted)
- **Compression**: Old logs are gzipped to save space

Example structure:

```
logs/
  all-2025-12-18.log          (today's logs)
  all-2025-12-17.log.gz       (yesterday, compressed)
  all-2025-12-16.log.gz       (2 days ago, compressed)
  error-2025-12-18.log        (today's errors)
  error-2025-12-17.log.gz     (yesterday's errors)
```

## Configuration

The logger is configured in `app/config/logger.js`:

```javascript
import logger from "./app/config/logger.js";
```

### Environment-Based Logging

- **Development**: Logs all levels (debug and above)
- **Production**: Logs warnings and errors only

Set your environment:

```bash
export NODE_ENV=production
```

## Usage Examples

### Basic Logging

```javascript
import logger from "../config/logger.js";

// Info level
logger.info("Server started successfully");

// Error level
logger.error("Database connection failed");

// Warning level
logger.warn("Deprecated API endpoint used");

// Debug level (only in development)
logger.debug("Processing user request");
```

### Logging with Context

```javascript
// Log with variables
logger.info(`User ${userId} logged in successfully`);

// Log with objects
logger.error(`Error in payment processing: ${err.message}`);

// Log with JSON data
logger.debug(`Request data: ${JSON.stringify(requestBody)}`);
```

### In Controllers

The `lesson.controller.js` shows examples of logging:

```javascript
exports.create = (req, res) => {
  logger.debug(`Creating lesson: ${lesson.title}`);

  Lesson.create(lesson)
    .then((data) => {
      logger.info(`Lesson created successfully: ${data.id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating lesson: ${err.message}`);
      res.status(500).send({ message: err.message });
    });
};
```

## HTTP Request Logging

Morgan is configured to log all HTTP requests through Winston:

```javascript
app.use(morgan("combined", { stream: logger.stream }));
```

This logs:

- Request method and URL
- Status code
- Response time
- User agent
- Timestamp

## Best Practices

1. **Use appropriate log levels**:

   - `error` for exceptions and critical failures
   - `warn` for validation failures or deprecated features
   - `info` for successful operations
   - `debug` for detailed troubleshooting

2. **Include context**:

   ```javascript
   // Good
   logger.error(`Failed to update user ${userId}: ${err.message}`);

   // Not as helpful
   logger.error("Update failed");
   ```

3. **Don't log sensitive data**:

   - Never log passwords, tokens, or API keys
   - Be careful with PII (Personally Identifiable Information)

4. **Log structured data when needed**:
   ```javascript
   logger.info(`Operation completed`, {
     userId: user.id,
     duration: endTime - startTime,
   });
   ```

## Testing

When running tests, logging is automatically adjusted to avoid cluttering test output:

```javascript
if (process.env.NODE_ENV !== "test") {
  // Normal logging
}
```

## Viewing Logs

### Console Output

During development, logs appear in the console with colors:

- Red: errors
- Yellow: warnings
- Green: info
- Magenta: HTTP requests
- White: debug

### Log Files

View log files using:

```bash
# View today's logs (replace date with current date)
tail -f logs/all-2025-12-18.log

# View today's errors
tail -f logs/error-2025-12-18.log

# View the most recent log file
tail -f logs/all-*.log | head -1

# Search across all logs
grep "error" logs/all-*.log

# View compressed logs
zcat logs/all-2025-12-17.log.gz
```

## Production Considerations

For production deployments:

1. **Log Rotation**: ✅ Already configured with daily rotation, 14-day retention, and compression
2. **Log Aggregation**: Consider services like:

   - CloudWatch (AWS)
   - Stackdriver (GCP)
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Datadog
   - Papertrail

3. **Performance**: Winston is configured for async logging to minimize performance impact

## Installation

The required packages are already added to `package.json`:

```bash
npm install
```

Packages installed:

- `winston` - Main logging library
- `morgan` - HTTP request logger
- `express-winston` - Express.js integration
- `winston-daily-rotate-file` - Log rotation

## Troubleshooting

### Logs not appearing

1. Check `NODE_ENV` setting
2. Verify log level in `logger.js`
3. Ensure `logs/` directory exists

### Too much logging

Adjust the log level in `app/config/logger.js` or set environment variable:

```bash
export LOG_LEVEL=warn
```

### Logs not colorized

Colors are automatically disabled in production. To force colors:

```javascript
winston.format.colorize({ all: true });
```
