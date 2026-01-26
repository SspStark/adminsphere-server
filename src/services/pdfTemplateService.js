import path from 'path';
import ejs from 'ejs';

export const renderUsersReportHTML = async (users) => {
    try {
        const templatePath = path.join(process.cwd(), "views", "reports", "users-report.ejs");
        const html = await ejs.renderFile(templatePath, { users });
        return html;
    } catch (error) {
        console.error("EJS render error:", error);
        throw new Error("Failed to render users report");
    }
}