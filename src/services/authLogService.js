import AuthLog from "../models/AuthLog.js";

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
        console.error("Auth log failed:", error);
    }
};
