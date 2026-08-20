const express = require('express');
const pinoHttp = require('pino-http');
const { initConfigWatcher } = require('./config/loader');
const { getConfig } = require('./config/config');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const correlationMiddleware = require('./middleware/correlation');
const { metricsMiddleware, metricsRouter } = require('./middleware/metrics');
const reloadRouter = require('./config/reload');

// Initialize configuration watcher
initConfigWatcher();

const app = express();

// Add correlation ID middleware (must be before logger so req.id is set)
app.use(correlationMiddleware);

// Add Pino HTTP logger
app.use(pinoHttp({ logger }));

// Track request duration for Prometheus
app.use(metricsMiddleware);

// Expose Prometheus metrics endpoint
app.use(metricsRouter);

// Expose Admin config reload endpoint
app.use(reloadRouter);

// Basic health endpoints
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/readyz', (req, res) => {
    // Basic liveness - in a real app, check DB/Redis connections here
    res.status(200).json({ status: 'ready' });
});

// Setup Gateway Routes
const { setupRoutes } = require('./proxy/router');
setupRoutes(app);

// Use global error handler
app.use(errorHandler);

const config = getConfig();
const port = config.server?.port || 8080;

let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(port, () => {
        logger.info(`Gateway listening on port ${port}`);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    if (server) {
        server.close(() => {
            logger.info('HTTP server closed');
        });
    }
});

module.exports = app;
