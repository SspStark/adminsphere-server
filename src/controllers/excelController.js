import User from "../models/User.js";
import { generateUserExcelBuffer } from "../services/excelService.js";

export const downloadUsersExcel = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        const excelBuffer = await generateUserExcelBuffer(users);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=users.xlsx"
        );

        res.send(excelBuffer);
    } catch (error) {
        console.error("Users Excel error:", error);
        res.status(500).json({ success: false, message: "Failed to generate users Excel" });
    }
}