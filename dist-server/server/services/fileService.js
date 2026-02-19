import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";
const isVercel = process.env.VERCEL === "1";
const uploadDir = isVercel
    ? path.join("/tmp", "attachments")
    : path.join(process.cwd(), "server/uploads/attachments");
if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    catch (e) {
        logger.warn("Could not create upload directory, likely read-only filesystem:", e);
    }
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
export const fileUpload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type"));
        }
    }
});
export const FileService = {
    async deleteFile(id) {
        const attachment = await prisma.communicationAttachment.findUnique({ where: { id } });
        if (attachment) {
            const filePath = path.join(uploadDir, path.basename(attachment.storageKey));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await prisma.communicationAttachment.delete({ where: { id } });
        }
    },
    async downloadFile(id) {
        const attachment = await prisma.communicationAttachment.findUnique({ where: { id } });
        if (!attachment)
            throw new Error("File not found");
        return path.join(uploadDir, path.basename(attachment.storageKey));
    }
};
