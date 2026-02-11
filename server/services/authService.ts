import { prisma } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { EmailService } from "./emailService.js";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
import { logger } from "../lib/logger.js";

export const AuthService = {
    async register(data: { email: string, password: string, fullName: string, state?: string, ip?: string }) {
        const { email, password, fullName, state, ip } = data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new Error("Email already registered");

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                state,
                role: 'EXECUTOR',
                lastIp: ip,
                lastLoginAt: new Date()
            }
        });

        // Create an initial estate for the user
        await prisma.estate.create({
            data: {
                userId: user.id,
                name: `${fullName || 'My'}'s Estate`,
                deceasedFirstName: "TBD",
                deceasedLastName: "TBD",
                deceasedDateOfDeath: new Date(),
                deceasedState: state || "CA",
                probateStatus: "NOT_STARTED"
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        return { user, token };
    },

    async login(email: string, password: string, ip?: string) {
        const user = await prisma.user.findUnique({ where: { email } }) as any;
        if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new Error("Invalid email or password");

        // Update Audit Info
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastIp: ip,
                lastLoginAt: new Date()
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        return { user, token };
    },

    async verifyToken(token: string) {
        try {
            if (!token || token === 'null' || token === 'undefined') {
                logger.debug("🔑 [VERIFY] Token is empty or literal 'null'/'undefined'");
                return null;
            }

            // Diagnostic: Log secret status at verification time (sanitized)
            const isSecretDefault = JWT_SECRET === "your-secret-key-change-this";
            logger.debug(`🔑 [VERIFY] Secret Status: ${isSecretDefault ? "DEFAULT (INSECURE)" : "CUSTOM"}`);

            const decoded: any = jwt.verify(token, JWT_SECRET);
            logger.debug(`👤 [VERIFY] JWT Valid for user ID: ${decoded.userId}`);

            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user) {
                logger.debug(`❌ [VERIFY] User ID ${decoded.userId} not found`);
                return null;
            }

            return user;
        } catch (error: any) {
            logger.error("🔑 [VERIFY] JWT rejection:", error.message);
            if (error.name === 'TokenExpiredError') {
                logger.debug(`⏰ [VERIFY] Expired at: ${error.expiredAt}`);
            } else if (error.name === 'JsonWebTokenError') {
                logger.debug("🛠️ [VERIFY] Invalid signature");
            }
            return null;
        }
    },

    async updateProfile(userId: string, data: { fullName?: string, state?: string, role?: string, personalEmail?: string, address?: string, city?: string, zip?: string, country?: string, phoneNumber?: string }) {
        return await prisma.user.update({
            where: { id: userId },
            data
        });
    },

    async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("No user found with this email");

        const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits for simplicity
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: token,
                resetPasswordExpires: expires
            }
        });

        const appUrl = (await EmailService.getAppUrl()).replace(/\/$/, ""); // Ensure no trailing slash
        const resetLink = `${appUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

        await EmailService.sendPasswordResetEmail(email, resetLink);

        return { message: "Reset code sent successfully" };
    },

    async resetPassword(data: { email: string, token: string, newPassword: string }) {
        const { email, token, newPassword } = data;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || user.resetPasswordToken !== token || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new Error("Invalid or expired reset token");
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        return { message: "Password updated successfully" };
    }
};
