import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://meu-redis:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => {
  console.log(`[Redis] Conectado (PID: ${process.pid})`);
});

redis.on("error", (err) => {
  console.error("[Redis] Erro:", err);
});