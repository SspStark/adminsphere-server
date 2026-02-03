import { createClient } from "redis";
import logger from "./logger.js";

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
            logger.info("Redis Ready");
        });

        redisClient.on("end", () => {
            redisReady = false;
            logger.warn("Redis disconnected")
        })

        redisClient.on("error", (error) => {
            redisReady = false;
            logger.error("Redis Client Error:", error);
        });

        await redisClient.connect();
        logger.info("Redis Connected (Upstash)");
    } catch (error) {
        logger.error("Redis connection failed (non-fatal):", error);
    }
};

export const getRedisClient = () => {
    if (!redisReady) {
        return null;
    }
    return redisClient;
};
