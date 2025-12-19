import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadImageFromBuffer = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result)
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

export const deleteImageFromCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Failed to delete image from Cloudinary:", error);
    }
}