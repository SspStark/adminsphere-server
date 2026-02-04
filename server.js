import "dotenv/config";

import express from 'express';
import http from 'http'
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/db.js'
import { initRedis, getRedisClient  } from './src/config/redisClient.js';
import registerRoutes from './src/routes/index.js';
import { initSocket } from './src/services/socketService.js';
import { startCronSystem } from "./src/cron/index.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import logger from "./src/config/logger.js";


// GLOBAL PROCESS ERROR HANDLERS
process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection", reason);
});

process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", error);
    process.exit(1);
});

const app = express();
let server;

// SIGNAL HANDLERS (GLOBAL) graceful shutdown (nodemon / ctrl+c)
const shutdown = async () => {
    logger.info("Shutting down server...");

    try {
        if (server) {
            await new Promise((resolve) => {
                server.close(() => {
                    logger.info("HTTP server closed");
                    resolve();
                });
            });
        }
        const redisClient = getRedisClient();
        if (redisClient) {
            await redisClient.quit();
            logger.info("Redis connection closed");
        }
    } catch (error) {
        logger.error("Error during shutdown:", error);
    }

    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// trust proxy (prod)
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// middlewares
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));


// all registered routes
registerRoutes(app);

app.get('/', (req, res) => res.send("AdminSphere server running..."));

app.use(errorHandler);

const PORT = process.env.PORT;

const initializeDBAndServer = async () => {
    try {
        await connectDB();
        await initRedis();

        const server = http.createServer(app);
        initSocket(server);

        server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

        startCronSystem();
    } catch (error) {
        logger.error("Server startup error:", error);
        process.exit(1);
    }
}

initializeDBAndServer();
