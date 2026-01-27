import { registerCronSchedules } from "./schedules.js";

export const startCronSystem = () => {
    console.log("⏱️ Starting cron system...");
    registerCronSchedules();
    console.log("✅ Cron system started");
} 