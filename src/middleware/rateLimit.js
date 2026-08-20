const { checkRateLimit } = require('../store/rateLimit');
const { getConfig } = require('../config/config');
const logger = require('../config/logger');

function rateLimitMiddleware(routeConfig) {
    return async (req, res, next) => {
        const config = getConfig();
        
        // Determine limit (route specific override or global)
        const limit = routeConfig.rateLimit?.requests_per_second || config.global_rate_limit?.requests_per_second || 100;
        
        // Trusted internal bypass example
        if (req.headers['x-internal-bypass'] === 'true') {
            return next();
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        // Use client identity if authenticated, otherwise fallback to IP
        const clientIdentifier = req.identity?.subject || clientIp;
        const key = `gateway:rate:${clientIdentifier}:${routeConfig.path_prefix}`;

        try {
            const { allowed, remaining, resetIn } = await checkRateLimit(key, limit, 1);

            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', remaining);
            res.setHeader('X-RateLimit-Reset', resetIn);

            if (!allowed) {
                res.setHeader('Retry-After', resetIn);
                return res.status(429).json({ error: 'Too Many Requests' });
            }

            next();
        } catch (err) {
            // Fail open or fail safe depending on policy. Constitution says fail safe.
            logger.error({ err }, 'Rate limit check failed, failing safe');
            return res.status(503).json({ error: 'Service Unavailable' });
        }
    };
}

module.exports = rateLimitMiddleware;
