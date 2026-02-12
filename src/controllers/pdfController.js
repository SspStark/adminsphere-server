import User from "../models/User.js";
import logger from "../config/logger.js";
import { renderUsersReportHTML } from "../integrations/pdf/pdfTemplateService.js";
import { generatePDFBuffer } from "../integrations/pdf/pdfService.js";

export const downloadUsersPDF = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        const html = await renderUsersReportHTML(users);

        const pdfBuffer = await generatePDFBuffer(html);

        res.setHeader("content-type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=users-report.pdf"
        );

        // Stream buffer to client
        res.send(pdfBuffer);
    } catch (error) {
        logger.error("Users PDF error:", error);
        res.status(500).json({ success: false, message: "Failed to generate users PDF" });
    }
}