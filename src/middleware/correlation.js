const crypto = require('crypto');

function correlationMiddleware(req, res, next) {
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
    req.id = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
}

module.exports = correlationMiddleware;
