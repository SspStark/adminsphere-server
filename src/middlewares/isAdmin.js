export const isAdmin = (req, res, next) => {
    if (req.user.role === "admin" || req.user.role === "super-admin"){
        return next();
    }

    return res.status(403).json({ success: false, message: "Access denied. Admins only."});
}