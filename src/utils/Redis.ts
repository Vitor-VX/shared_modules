import { type RedisClientType, createClient } from '@redis/client';

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redisClient = createClient({ url: REDIS_URL });

const redisSubscriberClient = redisClient.duplicate();

async function connectRedis() {
    if (redisClient.isReady && redisSubscriberClient.isReady) {
        return;
    }
    try {
        await Promise.all([
            redisClient.connect(),
            redisSubscriberClient.connect()
        ]);
        console.log(`[Redis] Conexão estabelecida com sucesso para o processo PID: ${process.pid}`);
    } catch (error) {
        console.error('[Redis] Falha crítica ao conectar:', error);
    }
}

redisClient.on('error', err => console.error('[Redis Client Error]', err));
redisSubscriberClient.on('error', err => console.error('[Redis Subscriber Error]', err));

const redis: RedisClientType<any, any> = redisClient;
const redisSubscriber: RedisClientType<any, any> = redisSubscriberClient;

export { redis, redisSubscriber, connectRedis }