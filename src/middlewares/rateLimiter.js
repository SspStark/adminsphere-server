import { getRedisClient } from "../config/redisClient.js";

export const rateLimiter = ({ keyPrefix, limit, windowSeconds }) => {
    return async (req, res, next) => {
        try {
            const redisClient = getRedisClient();
            const ip = req.ip || req.headers["x-forwarded-for"];
            const key = `rate::${keyPrefix}:${ip}`;

            const current = await redisClient.incr(key);

            if (current === 1) {
                await redisClient.expire(key, windowSeconds);
            }

            if (current > limit) {
                res.set("Retry-After", windowSeconds);
                return res.status(429).json({success: false, message: "Too many requests. Please try again later."})
            }

            next();
        } catch (error) {
            console.error("Rate limiter error:", error);
            // Fail-open (do NOT block auth if Redis fails)
            next();
        }
    }
}