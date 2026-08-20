const request = require('supertest');
const express = require('express');

// Set up mock config for tests before requiring app components
jest.mock('../src/config/config', () => ({
    getConfig: jest.fn().mockReturnValue({
        server: { port: 8080 },
        redis: { address: 'localhost:6379' },
        routes: [
            {
                path_prefix: '/test-route',
                upstream_cluster: 'test-cluster',
                auth_required: false,
            }
        ],
        clusters: [
            {
                name: 'test-cluster',
                instances: ['http://localhost:9999']
            }
        ]
    }),
    loadConfig: jest.fn()
}));

// Mock Redis to prevent real connections during tests
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        pipeline: jest.fn().mockReturnValue({
            zremrangebyscore: jest.fn(),
            zcard: jest.fn(),
            zadd: jest.fn(),
            expire: jest.fn(),
            exec: jest.fn().mockResolvedValue([[null, 'OK'], [null, 0], [null, 1], [null, 1]])
        })
    }));
});

const app = require('../src/index');

describe('Gateway Routing', () => {
    it('should return 200 on /health', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });

    it('should have metrics endpoint', async () => {
        const response = await request(app).get('/metrics');
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/^text\/plain/);
    });

    it('should inject correlation ID on health check', async () => {
        const response = await request(app).get('/health');
        expect(response.headers['x-correlation-id']).toBeDefined();
    });
});
