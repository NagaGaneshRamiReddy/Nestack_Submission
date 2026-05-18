const rules = {
  free: {
    ai: { limit: 5, windowSeconds: 60 },
    read: { limit: 30, windowSeconds: 60 }
  },
  paid: {
    ai: { limit: 30, windowSeconds: 60 },
    read: { limit: 120, windowSeconds: 60 }
  }
};
const store = new Map();

function rateLimiter(endpointType) {
  return function (req, res, next) {
  
    let tier = req.headers['x-user-tier'];
    if (typeof tier === 'string') {
      tier = tier.toLowerCase();
    }
    
    if (tier !== 'paid' && tier !== 'free') {
      tier = 'free';
    const userId = req.headers['x-user-id'] || req.ip;


    const rule = rules[tier]?.[endpointType];
    
    if (!rule) {
      return next(); 
    }

    
    const key = `${userId}:${tier}:${endpointType}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry) {
    
      store.set(key, { count: 1, windowStart: now });
      return next();
    }

    const windowElapsed = now - entry.windowStart >= rule.windowSeconds * 1000;

    if (windowElapsed) {
    
      entry.count = 1;
      entry.windowStart = now;
      return next();
    }

    if (entry.count < rule.limit) {
      entry.count += 1;
      return next();
    }


    const windowEnd = entry.windowStart + rule.windowSeconds * 1000;
    const retryAfterMs = windowEnd - now;
    
    const retryAfterSeconds = Math.max(0, Math.ceil(retryAfterMs / 1000));

    return res.status(429).json({
      error: "rate_limit_exceeded",
      limit: rule.limit,
      window_seconds: rule.windowSeconds,
      retry_after_seconds: retryAfterSeconds
    });
  };
}

module.exports = rateLimiter;
