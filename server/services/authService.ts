import { prisma } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { EmailService } from "./emailService.js";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("Generic JWT_SECRET missing in environment variables. Server cannot start.");
}
import { logger } from "../lib/logger.js";
import { calculateIsTrialing } from "../utils/trialUtils.js";

export const AuthService = {
    async register(data: { email: string, password: string, fullName: string, state?: string, role?: string, userType?: "EXECUTOR" | "ADVISOR", ip?: string }) {
        const { email, password, fullName, state, role, userType, ip } = data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new Error("Email already registered");

        const passwordHash = await bcrypt.hash(password, 10);

        const safeUserType = userType || "EXECUTOR";

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                state,
                role: role || (safeUserType === "ADVISOR" ? "ADVISOR" : "EXECUTOR"),
                userType: safeUserType,
                lastIp: ip,
                lastLoginAt: new Date(),
                trialStartedAt: new Date()
            }
        });

        // Create an initial estate for the user ONLY if they are an executor
        if (safeUserType === "EXECUTOR") {
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
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        const isTrialing = calculateIsTrialing(user.trialStartedAt);
        return { user: { ...user, isTrialing }, token };
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
        const isTrialing = calculateIsTrialing(user.trialStartedAt);
        return { user: { ...user, isTrialing }, token };
    },

    async verifyToken(token: string) {
        try {
            if (!token || token === 'null' || token === 'undefined') {
                logger.debug("🔑 [VERIFY] Token is empty or literal 'null'/'undefined'");
                return null;
            }

            // Diagnostic: Log secret status at verification time (sanitized)
            const isSecretConfigured = !!JWT_SECRET;
            logger.debug(`🔑 [VERIFY] Secret Configured: ${isSecretConfigured ? "YES" : "NO"}`);

            const decoded: any = jwt.verify(token, JWT_SECRET as string);
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
        // Generic response to prevent email enumeration
        const genericResponse = { message: "If an account exists with this email, a reset code has been sent." };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Simulate processing time to mitigate timing attacks
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 200) + 100));
            return genericResponse;
        }

        // Generate a cryptographically secure token (32 bytes hex = 64 chars)
        const token = (await import("crypto")).randomBytes(32).toString('hex');

        // Hash the token before storing it
        const tokenHash = await bcrypt.hash(token, 10);

        const expires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: tokenHash, // Store hash, not plain token
                resetPasswordExpires: expires
            }
        });

        const appUrl = (await EmailService.getAppUrl()).replace(/\/$/, "");
        // Send the raw token in the link (it will be hashed for verification)
        const resetLink = `${appUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

        await EmailService.sendPasswordResetEmail(email, resetLink);

        return genericResponse;
    },

    async resetPassword(data: { email: string, token: string, newPassword: string }) {
        const { email, token, newPassword } = data;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new Error("Invalid or expired reset token");
        }

        // Verify the provided token matches the stored hash
        const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
        if (!isValidToken) {
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
