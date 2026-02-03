import AuthLog from "../models/AuthLog.js";
import logger from "../config/logger.js";

export const logAuthEvent = async ({ userId = null, action, provider, req }) => {
    try {
        await AuthLog.create({
            userId,
            action,
            provider,
            ip: req.ip || req.headers["x-forwarded-for"],
            userAgent: req.headers["user-agent"]
        });
    } catch (error) {
        // Logging must NEVER break auth
        logger.error("Auth log failed:", error);
    }
};
