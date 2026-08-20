function formatErrorResponse(error, status = 500) {
    return {
        error: {
            message: error.message || 'Internal Server Error',
            status: status
        }
    };
}

module.exports = {
    formatErrorResponse
};
