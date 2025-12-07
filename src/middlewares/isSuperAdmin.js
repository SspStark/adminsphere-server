export function isSuperAdmin(req, res, next) {
    if (req.user.role === "super-admin"){
        return next();
    }else {
        res.status(403).json({ success: false, message: "Access denied. Super admin only." });
    }
};