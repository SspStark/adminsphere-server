import { createClient } from "redis";

let redisClient = null;
let redisReady = false;

export const initRedis = async () => {
    try {
        redisClient = createClient({
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 10000
            }
        });

        redisClient.on("ready", () => {
            redisReady = true;
            console.log("Redis Ready");
        });

        redisClient.on("end", () => {
            redisReady = false;
            console.warn("Redis disconnected")
        })

        redisClient.on("error", (err) => {
            redisReady = false;
            console.error("Redis Client Error:", err);
        });

        await redisClient.connect();
        console.log("Redis Connected (Upstash)");
    } catch (error) {
        console.error("Redis connection failed (non-fatal):", error);
    }
};

export const getRedisClient = () => {
    if (!redisReady) {
        return null;
    }
    return redisClient;
};
