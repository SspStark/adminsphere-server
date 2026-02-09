import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import registerRoutes from './src/routes/index.js';
import { errorHandler } from "./src/middlewares/errorHandler.js";

const app = express();

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

export default app;