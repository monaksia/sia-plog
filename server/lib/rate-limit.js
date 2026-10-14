// Bound memory and enforce limits independently of the reverse proxy.
export function rateLimit({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const entries = new Map();
  const timer = setInterval(() => {
    for (const [key, value] of entries) if (value.resetAt <= Date.now()) entries.delete(key);
  }, Math.min(windowMs, 60_000));
  timer.unref();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    let entry = entries.get(key);
    if (!entry || entry.resetAt <= now) {
      if (entries.size >= 10_000 && !entry) {
        res.set('Retry-After', '60');
        return res.status(429).json({ error: '请求过于频繁，请稍后重试' });
      }
      entry = { count: 0, resetAt: now + windowMs };
      entries.set(key, entry);
    }
    if (++entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: '请求过于频繁，请稍后重试' });
    }
    next();
  };
}
