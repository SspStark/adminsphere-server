import logger from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);

    res.status(err.status || 500).json({
        success: false,
        message: "Internal server error"
    });
}