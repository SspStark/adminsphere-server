import { body, validationResult } from "express-validator";

export const createUserValidation = [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),

    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),

    body("username")
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3 }).withMessage("Username must be at least 3 characters")
        .matches(/^[a-zA-Z0-9._]+$/).withMessage("Username contains invalid characters"),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    body("role")
        .notEmpty().withMessage("Role is required")
        .isIn(["admin", "employee"]).withMessage("Invalid role")
]

export function validateResult(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    next();
};