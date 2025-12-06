import { createClient } from "redis";

let redisClient = null;

export const initializeRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL
        });

        redisClient.on("error", (err) => {
            console.error("Redis Client Error:", err);
        });

        await redisClient.connect();
        console.log("Redis Connected (Upstash)");
    } catch (error) {
        console.error("Redis connection failed:", error);
        throw error;
    }
};

export const getRedisClient = () => {
    if (!redisClient) {
        throw new Error("Redis client not initialized. Call initRedis() first.");
    }
    return redisClient;
};
