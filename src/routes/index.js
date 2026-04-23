import adminRoutes from "./adminRoutes.js";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js"
import taskRoutes from "./taskRoutes.js"

export default function registerRoutes(app) {
    app.use("/api/v1/admin", adminRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/users", userRoutes);
    app.use("/api/v1/tasks", taskRoutes);
}