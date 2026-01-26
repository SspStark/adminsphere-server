import puppeteer from "puppeteer";

export const generatePDFBuffer = async (html) => {
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();

        // Load HTML into chromium
        await page.setContent(html, {
            waitUntil: "networkidle0"
        });

        // Generate PDF as BUFFER
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        });

        return pdfBuffer;
    } catch (error) {
        console.error("PDF generation error:", error);
        throw new Error("Failed to generate PDF");
    } finally {
        // avoid memory leaks
        if (browser) {
            await browser.close();
        }
    }
}