import multer from "multer";

const storage = multer.memoryStorage();

const uploadTaskFiles = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        
        const isValid = allowedTypes.some(type => file.mimetype.startsWith(type));

        if (!isValid) {
            return cb(new Error("Unsupported file type"), false);
        }

        cb(null, true);
    }
});

export default uploadTaskFiles;