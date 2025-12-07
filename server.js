import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/db.js'
import { initializeRedis } from './src/config/redisClient.js';
import registerRoutes from './src/routes/index.js';
import { createMailTransporter } from './src/services/mailService.js';

// load env
dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));


// all registered routes
registerRoutes(app);

createMailTransporter();

app.get('/', (req, res) => res.send("AdminSphere server running..."));

const PORT = process.env.PORT;

const initializeDBAndServer = async () => {
    try {
        await initializeRedis();
        await connectDB();

        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
}

initializeDBAndServer()
