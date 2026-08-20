const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
    logger.error({ err, reqId: req.id }, 'Unhandled error');
    
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: {
            message,
            status: statusCode,
        }
    });
}

module.exports = errorHandler;
