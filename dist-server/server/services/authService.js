import { prisma } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { EmailService } from "./emailService.js";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("Generic JWT_SECRET missing in environment variables. Server cannot start.");
}
import { logger } from "../lib/logger.js";
import { calculateIsTrialing } from "../utils/trialUtils.js";
export const AuthService = {
    async register(data) {
        const { email, password, fullName, state, role, userType, ip } = data;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            throw new Error("Email already registered");
        const passwordHash = await bcrypt.hash(password, 10);
        const safeUserType = userType || "EXECUTOR";
        let assignedRole = role;
        if (!assignedRole) {
            if (email.toLowerCase() === 'aravind45@gmail.com') {
                assignedRole = 'ADMIN';
            }
            else if (safeUserType === "ADVISOR") {
                assignedRole = 'ADVISOR';
            }
            else if (safeUserType === "HEIR") {
                assignedRole = 'HEIR';
            }
            else {
                assignedRole = 'EXECUTOR';
            }
        }
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                state,
                role: assignedRole,
                userType: safeUserType,
                lastIp: ip,
                lastLoginAt: new Date(),
                trialStartedAt: new Date(),
                verificationToken: crypto.randomBytes(32).toString('hex')
            }
        });
        // Send Verification Email
        const appUrl = (await EmailService.getAppUrl()).replace(/\/$/, "");
        const verificationLink = `${appUrl}/verify-email?email=${encodeURIComponent(email)}&token=${user.verificationToken}`;
        await EmailService.sendVerificationEmail(email, verificationLink);
        // CREATE SKELETON ESTATE FOR EXECUTORS
        // The OnboardingWizard expects an estate to exist for the current user.
        if (assignedRole === 'EXECUTOR') {
            try {
                await prisma.estate.create({
                    data: {
                        userId: user.id,
                        name: `${user.fullName}'s Estate`,
                        deceasedFirstName: "",
                        deceasedLastName: "Estate",
                        deceasedState: state || "CA", // Default to CA if unset
                        status: "active",
                        deceasedDateOfDeath: new Date() // Add required field
                    }
                });
                logger.debug(`✅ [AUTH] Skeleton estate created for user: ${user.id}`);
            }
            catch (estateError) {
                logger.error("❌ [AUTH] Failed to create skeleton estate:", estateError.message);
                // We proceed anyway as the wizard can sometimes handle creation, 
                // but this initial skeleton unblocks the Step 1 lookup.
            }
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        const isTrialing = calculateIsTrialing(user.trialStartedAt);
        return { user: { ...user, isTrialing }, token };
    },
    async resendVerification(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error("User not found");
        if (user.emailVerifiedAt)
            return { message: "Email already verified" };
        const newToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: userId },
            data: { verificationToken: newToken }
        });
        const appUrl = (await EmailService.getAppUrl()).replace(/\/$/, "");
        const verificationLink = `${appUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${newToken}`;
        await EmailService.sendVerificationEmail(user.email, verificationLink);
        return { message: "Verification email sent" };
    },
    async login(email, password, ip) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password");
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            throw new Error("Invalid email or password");
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
    async verifyToken(token) {
        try {
            if (!token || token === 'null' || token === 'undefined') {
                logger.debug("🔑 [VERIFY] Token is empty or literal 'null'/'undefined'");
                return null;
            }
            // Diagnostic: Log secret status at verification time (sanitized)
            const isSecretConfigured = !!JWT_SECRET;
            logger.debug(`🔑 [VERIFY] Secret Configured: ${isSecretConfigured ? "YES" : "NO"}`);
            const decoded = jwt.verify(token, JWT_SECRET);
            logger.debug(`👤 [VERIFY] JWT Valid for user ID: ${decoded.userId}`);
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user) {
                logger.debug(`❌ [VERIFY] User ID ${decoded.userId} not found`);
                return null;
            }
            return user;
        }
        catch (error) {
            logger.error("🔑 [VERIFY] JWT rejection:", error.message);
            if (error.name === 'TokenExpiredError') {
                logger.debug(`⏰ [VERIFY] Expired at: ${error.expiredAt}`);
            }
            else if (error.name === 'JsonWebTokenError') {
                logger.debug("🛠️ [VERIFY] Invalid signature");
            }
            return null;
        }
    },
    async updateProfile(userId, data) {
        return await prisma.user.update({
            where: { id: userId },
            data: {
                ...data,
                role: data.role
            }
        });
    },
    async forgotPassword(email) {
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
    async resetPassword(data) {
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
    },
    async verifyEmail(email, token) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.verificationToken !== token) {
            throw new Error("Invalid or expired verification token");
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: null,
                emailVerifiedAt: new Date()
            }
        });
        return { message: "Email verified successfully" };
    }
};
