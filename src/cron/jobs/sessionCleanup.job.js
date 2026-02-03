import logger from "../../config/logger.js";
import { getRedisClient } from "../../config/redisClient.js"

export const sessionCleanupJob = async () => {
    try {
        const redis = getRedisClient();
        if (redis) {
            const keys = await redis.keys("session:*");

            for (const key of keys) {
                const exists = await redis.exists(key);
                if (!exists) {
                    await redis.del(key);
                }
            }
            logger.info(`Session cleanup cron job completed`);
        } else {
            logger.warn("Redis skipped: Session cleanup cron job disabled");
        }
    } catch (error) {
        logger.error("Session cleanup cron job failed", error);
    }
}