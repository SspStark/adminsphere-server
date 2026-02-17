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

class AuthError extends Error {
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
    }
}

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
        isEmail ? { email: identifier.toLoweCase() } : { username: new RegExp("^" + identifier + "$", "i") }
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


