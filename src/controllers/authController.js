import logger from "../config/logger.js";
import * as authService from "../services/authService.js";

export const login = async (req, res) => {
    const { token, user } = await authService.login(req.body, req);

    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({ success: true, message: "Login successful", user });
};

export const logout = async (req, res) => {
    await authService.logout(req);
        
    res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getMe = async (req,res) => {
    const user = req.user;
    return res.status(200).json({ success: true, user });
};

export const forgotPassword = async (req, res) => {
    const result = await authService.forgotPassword(req.body.email, req);
    return res.status(200).json(result);
}

export const resetPassword = async (req, res) => {
    const result = await authService.resetPassword(req.body, req);
    return res.status(200).json(result);
};

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
        const { token } = await authService.googleOAuthLogin(req);

        res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false, maxAge: 86400000 });

        res.redirect(`${process.env.CLIENT_URL}/home`);
    } catch (error) {
        logger.error("Google OAuth error", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
    }
}