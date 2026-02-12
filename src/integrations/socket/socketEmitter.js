import { getIO } from "./socketServer.js";

const getSocket = () => getIO();

export const socketEmitter = {
    forceLogout(userId) {
        getSocket().to(`user:${userId}`).emit("FORCE_LOGOUT", {
            message: "Logged out due to another login"
        });
    }
}