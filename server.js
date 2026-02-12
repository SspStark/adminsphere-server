import "dotenv/config";
import http from 'http'

import app from "./app.js";
import connectDB from './src/config/db.js'
import { initRedis, getRedisClient  } from './src/config/redisClient.js';
import { initSocket } from './src/integrations/socket/socketServer.js';
import { startCronSystem } from "./src/cron/index.js";
import logger from "./src/config/logger.js";

const PORT = process.env.PORT;
let server;

// GLOBAL PROCESS ERROR HANDLERS
process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection", reason);
});

process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", error);
    process.exit(1);
});

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

const initializeDBAndServer = async () => {
    try {
        await connectDB();
        await initRedis();

        server = http.createServer(app);
        initSocket(server);

        server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

        startCronSystem();
    } catch (error) {
        logger.error("Server startup error:", error);
        process.exit(1);
    }
}

initializeDBAndServer();
