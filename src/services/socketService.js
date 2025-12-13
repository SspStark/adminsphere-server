import { Server } from 'socket.io';
import jwt from 'jsonwebtoken'
import cookie from 'cookie'

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    io.use((socket, next) => {
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
        } catch (err) {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user.id;
        console.log("Socket connected:", socket.id, "userId:", userId);

        // auto join user room
        socket.join(`user:${userId}`);

        socket.on("disconnected", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });
};

export const emitForceLogout = (userId) => {
    io.to(`user:${userId}`).emit("FORCE_LOGOUT", {
        message: "Logged out due to another login"
    });
};