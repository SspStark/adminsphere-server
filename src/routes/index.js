import adminRoutes from "./adminRoutes.js";
import authRoutes from "./authRoutes.js"

export default function registerRoutes(app) {
    app.use("/admin", adminRoutes);
    app.use("/", authRoutes);
}