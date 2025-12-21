import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getRedisClient } from "../config/redisClient.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ success: false, message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id, role, sessionId } = decoded;

        const redisClient = getRedisClient();

        if (redisClient) {
            const activeSessionId = await redisClient.get(`session:${id}`);
            if (!activeSessionId || activeSessionId !== sessionId){
                res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
                return res.status(401).json({ success: false, message: "Session expired or logged in from another device" });
            }
        } else {
            console.warn("Redis skipped: session enforcement disabled");
        }

        const user = await User.findById(id).select("-password");

        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        req.user = user;

        next();
    } catch (error) {
        console.error("Auth middleware error", error)
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}
