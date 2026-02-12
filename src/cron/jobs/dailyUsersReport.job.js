import User from "../../models/User.js";
import logger from "../../config/logger.js";
import { renderUsersReportHTML } from "../../integrations/pdf/pdfTemplateService.js";
import { generatePDFBuffer } from "../../integrations/pdf/pdfService.js";
import { sendEmailWithAttachment } from "../../integrations/mailService.js";

export const runDailyUsersReportJob = async () => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        const html = await renderUsersReportHTML(users);

        const pdfBuffer = await generatePDFBuffer(html);

        await sendEmailWithAttachment({
            to: ["sspchowdary00@gmail.com", "sspboddapati@gmail.com"],
            subject: "Daily Users Report - AdminSphere",
            html: `
                <p>Hello Admin,</p>
                <p>Please find attached the daily users report.</p>
                <p>— AdminSphere</p>
            `,
            attachments: [
                {
                    filename: "users-report.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });
        
        logger.info("Daily users report cron job completed");
    } catch (error) {
        logger.error("Daily users report cron job failed:", error);
    }
}