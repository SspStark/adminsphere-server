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
            console.log(`Session cleanup cron job completed`);
        } else {
            console.warn("Redis skipped: Session cleanup cron job disabled");
        }
    } catch (error) {
        console.error("Session cleanup cron job failed", error);
    }
}