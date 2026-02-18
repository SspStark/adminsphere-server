import logger from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl} - ${err.name}: ${err.message}`);

    const statusCode = err.statusCode || 500;

    if (!err.isOperational) {
        // unexpected crash
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }

    res.status(statusCode).json({ success: false, message: err.message });
}