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

const app = express();

//app.set("trust proxy", 1);

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

        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

        startCronSystem();

        // graceful shutdown (nodemon / ctrl+c)
        const shutdown = async () => {
          console.log("Shutting down server...");
          try {
            const redisClient = getRedisClient();
            if (redisClient) {
              await redisClient.quit();
              console.log("Redis connection closed");
            }
          } catch (err) {
            console.error("Error closing Redis:", err.message);
          }
          process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
}

initializeDBAndServer();
