const jwt = require('jsonwebtoken');
const { verifyJwt } = require('../src/middleware/jwt');
const { verifyApiKey } = require('../src/middleware/apikey');

describe('Auth Middleware Utilities', () => {
    describe('JWT Verification', () => {
        const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
        
        it('should verify a valid token', async () => {
            const token = jwt.sign({ sub: 'user123', roles: ['admin'] }, secret);
            const decoded = await verifyJwt(token);
            expect(decoded.sub).toBe('user123');
            expect(decoded.roles).toContain('admin');
        });

        it('should reject an invalid token', async () => {
            const token = jwt.sign({ sub: 'user123' }, 'wrong-secret');
            await expect(verifyJwt(token)).rejects.toThrow();
        });
    });

    describe('API Key Verification', () => {
        it('should verify valid API keys', () => {
            expect(verifyApiKey('default-service-key')).toBe(true);
        });

        it('should reject invalid API keys', () => {
            expect(verifyApiKey('invalid-key')).toBe(false);
        });
    });
});
