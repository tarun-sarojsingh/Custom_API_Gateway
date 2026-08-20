const logger = require('../config/logger');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-dev';

function adminAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing admin token' });
    }

    const token = authHeader.split(' ')[1];
    
    if (token === ADMIN_TOKEN) {
        next();
    } else {
        logger.warn({ ip: req.ip }, 'Unauthorized admin access attempt');
        res.status(403).json({ error: 'Forbidden' });
    }
}

module.exports = adminAuthMiddleware;
