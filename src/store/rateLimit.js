const { getRedisClient } = require('./redis');

// Sliding window rate limit using Redis Sorted Sets
async function checkRateLimit(key, limit, windowSeconds) {
    const redis = getRedisClient();
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    // Use a pipeline for atomic execution
    const pipeline = redis.pipeline();
    
    // Remove old tokens
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Count current tokens
    pipeline.zcard(key);
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    // Set expiry on the key to clean up automatically
    pipeline.expire(key, windowSeconds);
    
    const results = await pipeline.exec();
    
    // Extract the count from the zcard command result
    const currentCount = results[1][1];
    
    return {
        allowed: currentCount < limit,
        remaining: Math.max(0, limit - (currentCount + 1)),
        resetIn: windowSeconds // simplified reset time
    };
}

module.exports = {
    checkRateLimit,
};
