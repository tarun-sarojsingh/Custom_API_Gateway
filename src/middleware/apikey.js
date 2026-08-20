const VALID_API_KEYS = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : ['default-service-key'];

function verifyApiKey(key) {
    return VALID_API_KEYS.includes(key);
}

module.exports = {
    verifyApiKey
};
