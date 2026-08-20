const Redis = require('ioredis');
const { getConfig } = require('../config/config');
const logger = require('../config/logger');

let redisClient = null;

function getRedisClient() {
    if (!redisClient) {
        const config = getConfig();
        const address = config.redis?.address || 'localhost:6379';
        const [host, port] = address.split(':');
        
        redisClient = new Redis({
            host: host,
            port: parseInt(port, 10) || 6379,
            password: config.redis?.password || '',
            db: config.redis?.db || 0,
            lazyConnect: true,
        });

        redisClient.on('error', (err) => {
            logger.error({ err }, 'Redis connection error');
        });

        redisClient.on('connect', () => {
            logger.info('Connected to Redis successfully');
        });
    }
    return redisClient;
}

module.exports = {
    getRedisClient,
};
