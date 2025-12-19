import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const updateMe = async (req, res) => {
    try {
        const id = req.user._id.toString();

        if (req.body.username) {
            const exists = await User.findOne({ username: new RegExp("^" + req.body.username + "$", "i") });
            if (exists && exists._id.toString() !== id) {
                return res.status(400).json({ success: false, message: "Username already exists" });
            }
        }

        const allowedFields = ["firstName", "lastName", "username"];
        const updateData = {};
        
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        await User.findByIdAndUpdate(id, updateData, { new: true });

        return res.status(200).json({ success: true, message: "Profile updated successfully" });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const changeMyPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const id = req.user._id.toString();

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        console.error("Password change error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
