import bcrypt from "bcryptjs";
import crypto from "crypto"
import jwt from 'jsonwebtoken';
import User from "../models/user.js";
import { getRedisClient } from "../config/redisClient.js";

export const loginUser = async (req, res) => {
    try {
        const identifier = req.body.identifier.trim();
        const password = req.body.password;

        const isEmail = identifier.includes("@");

        const user = await User.findOne(
            isEmail ? { email: identifier.toLowerCase() } : { username: new RegExp("^" + identifier + "$", "i") });
        if (!user) return res.status(400).json({ success: false, message: "Invalid username/email" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid password" });

        const userId = user._id.toString();
        const sessionId = crypto.randomUUID();

        const redisClient = getRedisClient();
        await redisClient.set(`session:${userId}`, sessionId, { EX: 60 * 60 * 24 });

        const token = jwt.sign({ id: userId, role: user.role, sessionId }, process.env.JWT_SECRET, { expiresIn: "1d" });

        return res.status(200).json({
            success: true, 
            message: "Login successful", 
            token,
            user: { id: userId, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, role: user.role } 
        })
    } catch (error) {
        console.error("Login error", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}