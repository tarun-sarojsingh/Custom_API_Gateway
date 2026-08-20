const CircuitBreaker = require('opossum');
const { getConfig } = require('../config/config');
const logger = require('../config/logger');
const { formatErrorResponse } = require('./errors');

const breakers = new Map();

function getCircuitBreaker(cluster) {
    if (!breakers.has(cluster.name)) {
        const config = cluster.circuit_breaker || {
            timeout_ms: 3000,
            max_requests: 5,
            interval_ms: 10000,
        };

        const breakerOptions = {
            timeout: config.timeout_ms || 3000,
            errorThresholdPercentage: 50,
            resetTimeout: config.interval_ms || 10000,
        };

        // Dummy action for the breaker since http-proxy-middleware handles the actual request.
        // We will wrap the proxy middleware in the router instead.
        // Wait, opossum needs to execute a function. We can use it as a standard async gatekeeper.
        const breaker = new CircuitBreaker(async () => {
            return true;
        }, breakerOptions);

        breaker.fallback(() => {
            return formatErrorResponse(new Error('Service Unavailable - Circuit Open'), 503);
        });

        breaker.on('open', () => logger.warn(`[Circuit Breaker] OPEN for cluster: ${cluster.name}`));
        breaker.on('halfOpen', () => logger.info(`[Circuit Breaker] HALF_OPEN for cluster: ${cluster.name}`));
        breaker.on('close', () => logger.info(`[Circuit Breaker] CLOSED for cluster: ${cluster.name}`));

        breakers.set(cluster.name, breaker);
    }
    return breakers.get(cluster.name);
}

module.exports = {
    getCircuitBreaker
};
