import adminRoutes from "./adminRoutes.js";

export default function registerRoutes(app){
    app.use("/api/admin", adminRoutes);
}