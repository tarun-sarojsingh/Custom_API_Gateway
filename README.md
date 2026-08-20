# Custom API Gateway

A high-performance, resilient, horizontally scalable API Gateway (Reverse Proxy) designed for microservices architectures. Built with Node.js and Express.

## Key Features

- **Dynamic Reverse Proxy**: Path-based routing to configured upstream microservices via `http-proxy-middleware`.
- **Load Balancing**: Custom built-in round-robin load balancer.
- **Robust Rate Limiting**: Distributed Sliding-Window / Token-Bucket rate limiting backed by Redis. Supports global limits and per-route limits.
- **Resilience & Circuit Breaking**: Protects downstream services with `opossum` circuit breakers (timeouts, error thresholds). Fail-safe design.
- **Security & Authentication**:
  - JWT Verification with downstream claim forwarding (`X-User-Id`, `X-Roles`).
  - API Key Authentication for service-to-service communication.
- **Observability**:
  - Injects correlation IDs (`X-Correlation-ID`) across boundaries.
  - High-performance, structured JSON logging via `pino`.
  - Prometheus metrics exposed automatically at `/metrics`.
- **Hot-Reloadable Configuration**: Declarative YAML/JSON configuration (`gateway.json`) managed via `chokidar`. Configuration can be reloaded on-the-fly without dropping traffic.
- **Admin Operations**: Health checks (`/healthz`, `/readyz`) and secured config reload endpoints (`/admin/reload`).

## Tech Stack
- **Core**: Node.js, Express
- **State Store**: Redis (via `ioredis`)
- **Key Libraries**: `http-proxy-middleware`, `opossum`, `jsonwebtoken`, `pino`, `prom-client`
- **Testing**: Jest, Supertest

## Installation

1. Ensure you have Node.js (v18+) and Redis installed.
2. Clone the repository and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd my-portfolio
   npm install
   ```

## Configuration

The gateway uses a configuration-over-code philosophy. Modify `gateway.json` in the root of the directory to define your routing and cluster topologies:

```json
{
  "server": { "port": 8080 },
  "redis": { "address": "localhost:6379", "db": 0 },
  "global_rate_limit": { "requests_per_second": 100, "burst": 20 },
  "clusters": [
    {
      "name": "accounts-service",
      "instances": ["http://localhost:8081"],
      "circuit_breaker": { "timeout_ms": 3000, "max_requests": 5, "interval_ms": 10000 }
    }
  ],
  "routes": [
    {
      "path_prefix": "/accounts",
      "upstream_cluster": "accounts-service",
      "auth_required": true,
      "rateLimit": { "requests_per_second": 50 }
    }
  ]
}
```

## Running the Application

Ensure Redis is running (`redis-server`), then start the gateway:

```bash
npm start
```

For development mode (with `nodemon` and pretty logs):

```bash
npm run dev
```

*(Note: Add the `start` and `dev` scripts to your `package.json` if you haven't yet, e.g. `"start": "node src/index.js", "dev": "nodemon src/index.js | pino-pretty"`)*

## Endpoints

### Administrative
- `GET /health` : Simple check to see if the server process is alive.
- `GET /healthz` : Detailed health check.
- `GET /readyz` : Readiness probe for load balancers.
- `GET /metrics` : Prometheus scraped metrics.
- `POST /admin/reload` : Hot-reload the gateway configuration. Requires `Authorization: Bearer <ADMIN_TOKEN>`.

### Testing

Run the test suite via Jest:

```bash
npm test
```
