// Logger utility for the Study AI application

const winston = require('winston');

// Create logger with different levels
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.simple()
  ),
  defaultMeta: { service: 'study-ai-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Helper methods for common logging scenarios
const loggers = {
  error: (message, error = null) => {
    if (error) {
      logger.error(message, { error: error.message, stack: error.stack });
    } else {
      logger.error(message);
    }
  },
  
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },
  
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },
  
  // Log API requests
  request: (req, res, next) => {
    const start = Date.now();
    logger.info(`${req.method} ${req.url}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
      originalSend.call(this, data);
    };
    
    if (next) next();
  },
  
  // Log database operations
  database: (operation, collection, query = {}) => {
    logger.debug(`Database ${operation}`, {
      collection,
      query: JSON.stringify(query)
    });
  }
};

module.exports = {
  logger,
  ...loggers
};
