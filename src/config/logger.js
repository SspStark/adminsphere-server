import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize } = winston.format;

// Log format
const logFormat = printf(({ level, message, timestamp }) => {
    return process.env.NODE_ENV === "production" ? `${timestamp} [${level}]: ${message}` : `[${level}]: ${message}`;
});

// Fil transport (rotating)
const fileTransport = new DailyRotateFile({
    filename: "logs/combined-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "10d" 
});

const errorFileTransport = new DailyRotateFile({
    filename: "logs/error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxSize: "20m",
    maxFiles: "30d"
});

const logger = winston.createLogger({
    level: "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports: [fileTransport, errorFileTransport]
});

// Console logs for dev
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: combine(colorize(), logFormat)
        })
    );
}

export default logger;