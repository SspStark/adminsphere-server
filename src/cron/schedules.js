import cron from 'node-cron';
import { sessionCleanupJob } from './jobs/sessionCleanup.job.js';
import { runDailyUsersReportJob } from './jobs/dailyUsersReport.job.js';

export const registerCronSchedules = () => {
    console.log("⏱️ Registering cron schedules...");

    // Daily at 3 AM
    cron.schedule("0 3 * * *", async () => {
        await sessionCleanupJob();
    });

    // Daily at 8 PM
    cron.schedule("0 20 * * *", async () => {
        await runDailyUsersReportJob();
    });
}