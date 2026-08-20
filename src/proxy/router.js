const { createProxyMiddleware } = require('http-proxy-middleware');
const { getTargetUrl } = require('./balancer');
const { getConfig } = require('../config/config');
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimit');

function setupRoutes(app) {
    const config = getConfig();

    if (!config.routes || config.routes.length === 0) {
        return;
    }

    config.routes.forEach(route => {
        const cluster = config.clusters?.find(c => c.name === route.upstream_cluster);
        if (!cluster) {
            console.error(`Cluster ${route.upstream_cluster} not found for route ${route.path_prefix}`);
            return;
        }

        const proxyOptions = {
            target: cluster.instances[0] || 'http://localhost', // Initial target, overridden in router
            changeOrigin: true,
            pathRewrite: {
                // Keep path as is or rewrite if needed
            },
            router: function(req) {
                // Dynamically pick target from balancer
                return getTargetUrl(cluster);
            },
            onProxyReq: (proxyReq, req, res) => {
                // Forward identity claims
                if (req.identity) {
                    proxyReq.setHeader('X-User-Id', req.identity.subject || '');
                    proxyReq.setHeader('X-Roles', req.identity.roles?.join(',') || '');
                }
                if (req.id) {
                    proxyReq.setHeader('X-Correlation-ID', req.id);
                }
            },
            onError: (err, req, res) => {
                res.status(502).json({ error: 'Bad Gateway', details: err.message });
            }
        };

        const middlewares = [];
        
        // Rate Limiter
        if (rateLimitMiddleware) {
            middlewares.push(rateLimitMiddleware(route));
        }

        // Auth
        if (route.auth_required) {
            middlewares.push(authMiddleware);
        }

        // Add proxy middleware
        middlewares.push(createProxyMiddleware(proxyOptions));

        app.use(route.path_prefix, middlewares);
    });
}

module.exports = {
    setupRoutes,
};
