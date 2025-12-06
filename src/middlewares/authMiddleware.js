import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { getRedisClient } from "../config/redisClient.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ success: false, message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id, role, sessionId } = decoded;

        const redisClient = getRedisClient();
        const activeSessionId = await redisClient.get(`session:${id}`);
        if (!activeSessionId || activeSessionId !== sessionId){
            return res.status(401).json({ success: false, message: "Session expired or logged in from another device" });
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
