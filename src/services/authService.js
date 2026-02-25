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
import { logAuthEvent } from "./authLogService.js";
import constants from "../constants.js";
import { AuthError } from "../errors/appError.js";

const isAccountLocked = (user) => {
    if (!user.lockUntil) return false;
    return user.lockUntil > Date.now();
}

const recordFailedLogin = async (user) => {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= constants.MAX_LOGIN_ATTEMPTS){
        user.lockUntil = new Date(Date.now() + constants.LOCK_TIME_MS);
    }

    await user.save()
}

const resetLoginAttempts = async (user) => {
    if (user.failedLoginAttempts > 0) {
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
    }
}

export const login = async (body, req) => {
    const identifier = body.identifier.trim();
    const password = body.password;
    const isEmail = identifier.includes("@");

    const user = await User.findOne(
        isEmail ? { email: identifier.toLowerCase() } : { username: new RegExp("^" + identifier + "$", "i") }
    );

    if (!user) {
        await logAuthEvent({ action:"LOGIN_FAILED", provider:"local", req });
        throw new AuthError("Invalid username/email", 400);
    }

    if (!user.authProvider.includes("local")) {
        await logAuthEvent({ action: "LOGIN_FAILED", provider: "local", req });
        throw new AuthError(
            "Please login with your existing Google account and create a password",
            403
        );
    }

    if (isAccountLocked(user)) {
        throw new AuthError("Account temporarily locked. Try again later.", 423);
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        await recordFailedLogin(user);
        await logAuthEvent({ userId: user._id, action: "LOGIN_FAILED", provider: "local", req });

        // If just locked
        if (isAccountLocked(user)) {
            throw new AuthError("Too many failed attempts. Account locked for 15 minutes.", 423);
        }
        throw new AuthError("Invalid password", 400);
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

    return {
        token,
        user: { id: userId, firstName: user.firstName, lastName: user.lastName, username: user.username, 
            email: user.email, role: user.role
        }
    };
}

export const logout = async (req) => {
    const token = req.cookies.token;
    if (!token) return;

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return; // invalid/expired token
    }

    const userId = decoded.id;
    const isForceLogout = req.body?.forceLogout;

    if (!isForceLogout) {
        const redisClient = getRedisClient();
        if (redisClient) {
            await redisClient.del(`session:${userId}`);
        } else {
            logger.warn("Redis skipped: session enforcement disabled");
        }
    }

    await logAuthEvent({ userId, action: "LOGOUT", provider: "local", req });
}

export const forgotPassword = async (email, req) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return  { success: true, message: "If this email exists, a reset link has been sent." };
    }

    if (!user.authProvider.includes("local")) {
        throw new AuthError("Password reset not available for Google login users", 400);
    }

    const redisClient = getRedisClient();
    if (!redisClient) {
        logger.error("Redis unavailable during forgot password");
        throw new AuthError("Password reset temporarily unavailable. Please try later.", 503);
    }

    const resetToken = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "10m" });

    await redisClient.set(`password_reset:${user._id}`, "1", { EX: 600 });

    await sendPasswordResetEmail(user.email, resetToken);

    return { success: true, message: "Password reset link sent to email." };
}

export const resetPassword = async (body, req) => {
    const { token, newPassword } = body;

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        throw new AuthError("Invalid or expired reset token", 400);
    }

    const userId = decoded.id;
    const redisClient = getRedisClient();
    if (!redisClient) {
        logger.error("Redis unavailable during reset password");
        throw new AuthError("Password reset temporarily unavailable. Please try later.", 503);
    }

    const resetAllowed = await redisClient.get(`password_reset:${userId}`);

    if (!resetAllowed) {
        throw new AuthError("Invalid or expired reset token", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AuthError("User not found", 404);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Delete reset token
    await redisClient.del(`password_reset:${userId}`);

    // Force logout — delete session
    await redisClient.del(`session:${userId}`);

    await logAuthEvent({ userId: user._id, action: "PASSWORD_RESET", provider: "local", req });
    return { success: true, message: "Password reset successful. Please log in again." };
}

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

export const googleOAuthLogin = async (req) => {
    const { code } = req.query;

    if (!code) {
        throw new AuthError("Authorization code missing", 400);
    }

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
    const { sub, email, given_name, family_name, email_verified, picture } = payload;
    if (!email_verified) {
        throw new AuthError("Email not verified", 403);
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

    return { token };
}
