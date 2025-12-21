import constants from "../constants.js";

export const isAccountLocked = (user) => {
    if (!user.lockUntil) return false;
    return user.lockUntil > Date.now();
}

export const recordFailedLogin = async (user) => {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= constants.MAX_LOGIN_ATTEMPTS){
        user.lockUntil = new Date(Date.now() + constants.LOCK_TIME_MS);
    }

    await user.save()
}

export const resetLoginAttempts = async (user) => {
    if (user.failedLoginAttempts > 0) {
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
    }
}