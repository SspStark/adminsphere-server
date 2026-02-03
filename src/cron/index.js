import logger from "../config/logger.js";
import { registerCronSchedules } from "./schedules.js";

export const startCronSystem = () => {
    logger.log("⏱️ Starting cron system...");
    registerCronSchedules();
    logger.log("✅ Cron system started");
} 