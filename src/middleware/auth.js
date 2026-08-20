const { verifyJwt } = require('./jwt');
const { verifyApiKey } = require('./apikey');

// Auth bypass list for public routes can be added here if needed for exact paths
const bypassList = ['/health', '/readyz'];

async function authMiddleware(req, res, next) {
    if (bypassList.includes(req.path)) {
        return next();
    }

    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    if (apiKey) {
        if (verifyApiKey(apiKey)) {
            req.identity = { subject: 'service-client', roles: ['service'] };
            return next();
        }
        return res.status(401).json({ error: 'Invalid API Key' });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = await verifyJwt(token);
        // Map decoded token to identity claim
        req.identity = {
            subject: decoded.sub || decoded.id,
            roles: decoded.roles || [],
            issuer: decoded.iss
        };
        next();
    } catch (error) {
        req.log.warn({ err: error }, 'JWT Verification failed');
        return res.status(401).json({ error: 'Unauthorized', details: error.message });
    }
}

module.exports = authMiddleware;
