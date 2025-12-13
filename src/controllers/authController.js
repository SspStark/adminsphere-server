import bcrypt from "bcryptjs";
import crypto from "crypto"
import jwt from 'jsonwebtoken';
import User from "../models/user.js";
import { getRedisClient } from "../config/redisClient.js";
import { sendPasswordResetEmail } from "../services/mailService.js";
import appEvents from "../services/eventEmitter.js";

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

        const redisClient = getRedisClient();
        const oldSession = await redisClient.get(`session:${userId}`);
        if (oldSession){
            appEvents.emit("SESSION_REPLACE", { userId });
        }

        const sessionId = crypto.randomUUID();

        await redisClient.set(`session:${userId}`, sessionId, { EX: 60 * 60 * 24 });

        const token = jwt.sign({ id: userId, role: user.role, sessionId }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });

        return res.status(200).json({
            success: true, 
            message: "Login successful", 
            user: { id: userId, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, role: user.role } 
        });
    } catch (error) {
        console.error("Login error", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const logoutUser = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token){
            res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
            return res.status(200).json({ success: true, message: "User already logged out" });
        } 
        const isForceLogout = req.body?.forceLogout;
        
        if (!isForceLogout){
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const redisClient = getRedisClient();

            await redisClient.del(`session:${userId}`);
        }

        res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
        return res.status(200).json({ success: true, message: "Logged out" });
    }
};

export const getMe = async (req,res) => {
    try {
        const user = req.user;
        return res.status(200).json({ success: true, user });
    } catch (error){
        console.error("get current user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user){
            return res.status(200).json({ success: false, message: "If this email exists, a reset link has been sent." });
        }

        const userId = user._id.toString();
        const resetToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "10m" });

        const redisClient = getRedisClient();
        await redisClient.set(`password_reset:${user._id}`, resetToken, { EX: 60 * 10 });

        const emailSent = await sendPasswordResetEmail(user.email, resetToken);

        return res.status(200).json({ success: true, message: "Password reset link sent to email." });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const redisClient = getRedisClient();

        // Check Redis for valid token
        const storedToken = await redisClient.get(`password_reset:${userId}`);
        if (!storedToken || storedToken !== token) {
            return res.status(400).json({ success: false, message: "reset token" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Delete reset token
        await redisClient.del(`password_reset:${userId}`);

        // Force logout — delete session
        await redisClient.del(`session:${userId}`);

        return res.json({ success: true, message: "Password reset successful." });

    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }
};
