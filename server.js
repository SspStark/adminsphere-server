import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectDB from './src/config/db.js'
import registerRoutes from './src/routes/index.js';

// load env
dotenv.config();

const app = express();

// connect Database
connectDB();

// middlewares
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// all registered routes
registerRoutes(app);

app.get('/', (req, res) => res.send("AdminSphere server running..."));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
