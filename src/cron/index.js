import logger from "../config/logger.js";
import { registerCronSchedules } from "./schedules.js";

export const startCronSystem = () => {
    logger.info("⏱️ Starting cron system...");
    registerCronSchedules();
    logger.info("✅ Cron system started");
} 