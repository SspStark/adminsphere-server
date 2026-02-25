import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import logger from '../../config/logger.js';

let IO;

export function initSocket(server) {
    IO = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    IO.use((socket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;
            if (!rawCookie) return next(new Error("No cookies"));

            const cookies = cookie.parse(rawCookie);
            const token = cookies.token;
            
            if (!token) return next(new Error("No token"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.user = {
                id: decoded.id,
                role: decoded.role,
                sessionId: decoded.sessionId,
            };

            next(); // allow connection
        } catch (error) {
            next(new Error("Unauthorized"));
        }
    });

    IO.on("connection", (socket) => {
        const userId = socket.user.id;
        logger.info("Socket connected");

        // auto join user room
        socket.join(`user:${userId}`);

        socket.on("disconnect", () => {
            logger.info("Socket disconnected");
        });
    });
};

export function getIO() {
    if (!IO) throw new Error("Socket.io not initialized");
    return IO;
}