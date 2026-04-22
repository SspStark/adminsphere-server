import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import logger from "../config/logger.js";

export const uploadToCloudinary = (buffer, folder, resourceType = "auto") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (error, result) => {
                if (error) reject(error);
                else resolve(result)
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    } catch (error) {
        logger.error("Failed to delete image from Cloudinary:", error);
    }
}