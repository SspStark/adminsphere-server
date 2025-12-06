import User from "../models/user.js";
import bcrypt from "bcryptjs";

export const createSuperAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, username, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing){
            return res.status(400).json({ success: false, message: "Super admin already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ firstName, lastName, email, username, password: hashedPassword, role: "super-admin" });
        res.status(200).json({ success: true, message: "Super admin created successfully" });
    } catch (error) {
        console.error("Super admin error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

