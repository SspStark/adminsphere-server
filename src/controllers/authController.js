import bcrypt from "bcryptjs";
import crypto from "crypto"
import jwt from 'jsonwebtoken';
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import logger from "../config/logger.js";
import { getRedisClient } from "../config/redisClient.js";
import { sendPasswordResetEmail } from "../integrations/mailService.js";
import appEvents from "../events/appEvents.js";
import { logAuthEvent } from "../services/authLogService.js";
import { isAccountLocked, recordFailedLogin, resetLoginAttempts } from "../utils/accountLock.js";

export const loginUser = async (req, res) => {
    try {
        const identifier = req.body.identifier.trim();
        const password = req.body.password;

        const isEmail = identifier.includes("@");

        const user = await User.findOne(
            isEmail ? { email: identifier.toLowerCase() } : { username: new RegExp("^" + identifier + "$", "i") });
        if (!user) {
            await logAuthEvent({ action:"LOGIN_FAILED", provider:"local", req });
            return res.status(400).json({ success: false, message: "Invalid username/email" });
        }
        
        // BLOCK password login for Google users
        if (!user.authProvider.includes("local")) {
            await logAuthEvent({ action:"LOGIN_FAILED", provider:"local", req });
            return res.status(403).json({ success: false, message: "Please login with your existing Google account and create a password" });
        }

        if (isAccountLocked(user)) {
            return res.status(423).json({ success: false, message: "Account temporarily locked. Try again later." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await recordFailedLogin(user);
            await logAuthEvent({ userId: user._id, action: "LOGIN_FAILED", provider: "local", req });

            // If just locked
            if (isAccountLocked(user)) {
                return res.status(423).json({ success: false, message: "Too many failed attempts. Account locked for 15 minutes." });
            }

            return res.status(400).json({ success: false, message: "Invalid password" });
        }
        
        // Password correct → reset attempts
        await resetLoginAttempts(user);
        
        const userId = user._id.toString();
        const redisClient = getRedisClient();

        let sessionId = null;
        if (redisClient){
            const oldSession = await redisClient.get(`session:${userId}`);
            if (oldSession){
                appEvents.emit("SESSION_REPLACE", { userId });
            }

            sessionId = crypto.randomUUID();
            await redisClient.set(`session:${userId}`, sessionId, { EX: 60 * 60 * 24 });
        } else {
            logger.warn("Redis skipped: session enforcement disabled");
        }

        await logAuthEvent({ userId: user._id, action: "LOGIN_SUCCESS", provider: "local", req });

        const payload = {
            id: userId,
            role: user.role,
            ...(sessionId && { sessionId })
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });

        return res.status(200).json({
            success: true, 
            message: "Login successful", 
            user: { id: userId, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, role: user.role } 
        });
    } catch (error) {
        logger.error("Login error", error);
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

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        if (!isForceLogout){
            const redisClient = getRedisClient();

            if (redisClient){
                await redisClient.del(`session:${userId}`);
            } else {
                logger.warn("Redis skipped: session enforcement disabled");
            }
        }

        await logAuthEvent({ userId, action: "LOGOUT", provider: "local", req });

        res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        logger.error("Logout error:", error);
        res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
        return res.status(200).json({ success: true, message: "Logged out" });
    }
};

export const getMe = async (req,res) => {
    try {
        const user = req.user;
        return res.status(200).json({ success: true, user });
    } catch (error){
        logger.error("get current user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(200).json({ success: false, message: "If this email exists, a reset link has been sent." });
        }

        if (!user.authProvider.includes("local")) {
            return res.status(400).json({ success: false, message: "Password reset not available for Google login users" });
        }

        const redisClient = getRedisClient();
        if (!redisClient) {
            logger.error("Redis unavailable during forgot password");
            return res.status(503).json({ success: false, message: "Password reset temporarily unavailable. Please try later." });
        }

        const resetToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "10m" });

        await redisClient.set(`password_reset:${user._id}`, "1", { EX: 600 });

        await sendPasswordResetEmail(user.email, resetToken);

        return res.status(200).json({ success: true, message: "Password reset link sent to email." });
    } catch (error) {
        logger.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Password reset temporarily unavailable." });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const redisClient = getRedisClient();
        if (!redisClient) {
            logger.error("Redis unavailable during reset password");
            return res.status(503).json({ success: false, message: "Password reset temporarily unavailable. Please try later." });
        }

        const resetAllowed = await redisClient.get(`password_reset:${userId}`);

        if (!resetAllowed) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
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

        await logAuthEvent({ userId: user._id, action: "PASSWORD_RESET", provider: "local", req });

        return res.json({ success: true, message: "Password reset successful. Please log in again." });

    } catch (error) {
        logger.error("Reset password error:", error);
        return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }
};

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

export const googleAuth = (req, res) => {
    const redirectUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
      "&response_type=code" +
      "&scope=profile email";
  
    res.redirect(redirectUrl);
}

export const googleOAuthLogin = async (req, res) => {
    try {
        const { code } = req.query;

        // Exchange code for tokens
        const tokenRes = await axios.post("https://oauth2.googleapis.com/token", 
            {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code"
            }
        )

        const { id_token } = tokenRes.data;

        // Verify Google identity
        const ticket = await googleClient.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub, email, given_name, family_name, email_verified } = payload;

        if (!email_verified) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=email_not_verified`);
        }

        let user = await User.findOne({ googleId: sub });

        // Check for local user exists
        if (!user) {
            user = await User.findOne({ email });

            // Local user exists → LINK GOOGLE
            if (user && !user.authProvider.includes("google")){
                user.googleId = sub;
                user.authProvider.push("google");

                if (!user.profileImage?.url && payload.picture){
                    user.profileImage.url = payload.picture;
                }

                await user.save();
            }
        }

        // New Google user
        if (!user) {
            user = await User.create({
                firstName: given_name || email.split("@")[0],
                lastName: family_name || "",
                email,
                username: email.split("@")[0],
                authProvider: ["google"],
                googleId: sub
            });
        }

        const userId = user._id.toString();
        const redisClient = getRedisClient();
        let sessionId = null;
        if (redisClient){
            const oldSession = await redisClient.get(`session:${userId}`);
            if (oldSession) {
                appEvents.emit("SESSION_REPLACE", { userId });
            }
                   
            sessionId = crypto.randomUUID();      
            await redisClient.set(`session:${userId}`, sessionId, { EX: 86400 });
        } else {
            logger.warn("Redis skipped: session enforcement disabled");
        }

        await logAuthEvent({ userId: user._id, action: "GOOGLE_LOGIN", provider: "google", req });

        const tokenPayload = {
            id: userId,
            role: user.role,
            ...(sessionId && { sessionId })
        };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 86400000 });

        res.redirect(`${process.env.CLIENT_URL}/home`);
    } catch (error) {
        logger.error("Google OAuth error", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
    }
}
