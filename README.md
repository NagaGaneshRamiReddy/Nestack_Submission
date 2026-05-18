# Context-Aware Rate Limiter

This project implements a context-aware rate limiting middleware using Node.js and Express. It enforces different rate limits based on the user's tier (`free` or `paid`) and the type of endpoint they are accessing (`ai` or `read`).

## How to run

1. Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   The server will start on port 3000 by default.

### Testing the Endpoints
You can test the rate limiting behavior using `curl` or any API client like Postman.

Example request (Free Tier, AI Endpoint):
```bash
curl -i -X POST http://localhost:3000/ai/generate \
  -H "X-User-Tier: free"
```

If you exceed the limit (e.g., 5 requests within 60 seconds for Free/AI), you will receive a 429 response:
```json
{
  "error": "rate_limit_exceeded",
  "limit": 5,
  "window_seconds": 60,
  "retry_after_seconds": 34
}
```

## Design decisions

* **Middleware Factory:** I designed the rate limiter as a higher-order function (`rateLimiter(endpointType)`). This allows us to cleanly tag routes with their endpoint type (`ai` or `read`) at the route definition level without needing to parse the URL string inside the middleware.
* **In-Memory Store:** I used a standard JavaScript `Map` to track usage. `Map` provides O(1) lookup, insertion, and update performance, which is ideal for a fast middleware layer.
* **Concurrency Handling:** Node.js executes JavaScript on a single thread. This inherently protects the counter from race conditions during concurrent requests. Synchronous read-modify-write operations on the `Map` object are atomic.
* **User Identification:** To construct the unique key (`userId:tier:endpointType`), the application attempts to use a hypothetical `X-User-Id` header. If absent, it gracefully falls back to using the client's IP address (`req.ip`).

## Limitations

* **Memory Leaks (No Eviction):** The current in-memory `Map` only grows; it never deletes old keys. In a long-running production application with many unique users, this will eventually lead to an Out-Of-Memory (OOM) error. A production-ready solution would require a cleanup mechanism (e.g., a periodic background task to remove expired keys or an LRU cache implementation).
* **Horizontal Scalability:** Because the state is stored purely in the memory of the running process, the rate limiter will not work correctly if the application is scaled horizontally across multiple instances or workers. Each instance would maintain its own isolated counters.
* **No Persistent Storage:** If the application crashes or restarts, all current rate limiting state is lost, and users get their quotas reset immediately.
