import ExcelJS from 'exceljs';

export const generateUserExcelBuffer = async (users) => {
    const workbook = new ExcelJS.Workbook();

    // Metadata
    workbook.creater = "AdminSphere";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Users");

    // Define columns
    sheet.columns = [
        { header: "S.No", key: "index", width: 8 },
        { header: "First Name", key: "firstName", width: 18 },
        { header: "Last Name", key: "lastName", width: 18 },
        { header: "Email", key: "email", width: 30 },
        { header: "Username", key: "username", width: 18 },
        { header: "Role", key: "role", width: 15 },
        { header: "Joined At", key: "createdAt", width: 18 }
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: "middle" };

    // Data rows
    users.forEach((user, index) => {
        sheet.addRow({
            index: index + 1,
            firstName: user.firstName,
            lastName: user.lastName || "",
            email: user.email,
            username: user.username,
            role: user.role,
            createdAt: new Date(user.createdAt).toLocaleDateString()
        });
    });

    // Auto filter
    sheet.autoFilter = {
        from: "A1",
        to: "G1"
    };

    // Generate XLSX as BUFFER (in memory)
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}