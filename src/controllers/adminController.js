import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../services/mailService.js";

export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, username, password, role } = req.body;

        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists)  return res.status(400).json({ success: false, message: "Email already exists" });

        const usernameExists = await User.findOne({ username: new RegExp("^" + username + "$", "i") });
        if (usernameExists) return res.status(400).json({ success: false, message: "Username already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({ 
            firstName, lastName, email, username, password: hashedPassword, role
        });

        await sendWelcomeEmail({ firstName, lastName, email, username, password, role });

        res.status(201).json({ success: true, message: "User created successfully", user: { username, email, role } });
    } catch (error) {
        console.error("Create user error", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}