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
import { RoleUtils } from "../utils/userUtils.js";

export const AuthService = {
    async register(data: {
        email: string,
        password: string,
        fullName: string,
        state?: string,
        role?: string,
        userType?: "EXECUTOR" | "ADVISOR" | "HEIR",
        deceasedName?: string,
        estimatedValue?: string,
        ip?: string
    }) {
        const { email, password, fullName, state, role, userType, deceasedName, estimatedValue, ip } = data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new Error("Email already registered");

        const passwordHash = await bcrypt.hash(password, 10);

        const safeUserType = userType || "EXECUTOR";
        let assignedRole = role as any;

        if (!assignedRole) {
            if (email.toLowerCase() === 'aravind45@gmail.com') {
                assignedRole = 'ADMIN';
            } else if (safeUserType === "ADVISOR") {
                assignedRole = 'ADVISOR';
            } else if (safeUserType === "HEIR") {
                assignedRole = 'HEIR';
            } else {
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
                // Trial does NOT start at registration — grieving users may not
                // return for days. The clock starts lazily on their first
                // subscription-gated action (see middleware/subscription.ts).
                trialStartedAt: null,
                verificationToken: crypto.randomBytes(32).toString('hex')
            } as any
        }) as any;


        // Send Verification Email
        const appUrl = (await EmailService.getAppUrl()).replace(/\/$/, "");
        const verificationLink = `${appUrl}/verify-email?email=${encodeURIComponent(email)}&token=${user.verificationToken}`;
        await EmailService.sendVerificationEmail(email, verificationLink);

        // CREATE SKELETON ESTATE FOR EXECUTORS
        // The OnboardingWizard expects an estate to exist for the current user.
        if (assignedRole === 'EXECUTOR') {
            try {
                // Parse deceased name if provided
                let firstName = "";
                let lastName = "Estate";
                if (deceasedName) {
                    const parts = deceasedName.trim().split(/\s+/);
                    if (parts.length > 1) {
                        lastName = parts.pop() || "Estate";
                        firstName = parts.join(" ");
                    } else {
                        firstName = parts[0];
                    }
                }

                await prisma.estate.create({
                    data: {
                        userId: user.id,
                        name: deceasedName ? `${deceasedName}'s Estate` : `${user.fullName}'s Estate`,
                        deceasedFirstName: firstName,
                        deceasedLastName: lastName,
                        deceasedState: state || "",
                        status: "active",
                        deceasedDateOfDeath: new Date(),
                        estimatedPersonalProperty: estimatedValue ? parseFloat(estimatedValue) : undefined
                    } as any
                });
                logger.debug(`✅ [AUTH] Skeleton estate created for user: ${user.id}`);
            } catch (estateError: any) {
                logger.error("❌ [AUTH] Failed to create skeleton estate:", estateError.message);
                // We proceed anyway as the wizard can sometimes handle creation, 
                // but this initial skeleton unblocks the Step 1 lookup.
            }
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "8h" });
        const isTrialing = calculateIsTrialing(user.trialStartedAt);
        return { user: { ...user, isTrialing }, token };
    },

    async resendVerification(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } }) as any;
        if (!user) throw new Error("User not found");
        if (user.emailVerifiedAt) return { message: "Email already verified" };

        const newToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: userId },
            data: { verificationToken: newToken } as any
        });

        const appUrl = (await EmailService.getAppUrl()).replace(/\/$/, "");
        const verificationLink = `${appUrl}/verify-email?email=${encodeURIComponent(user.email)}&token=${newToken}`;
        await EmailService.sendVerificationEmail(user.email, verificationLink);
        return { message: "Verification email sent" };
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

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "8h" });
        const isTrialing = calculateIsTrialing(user.trialStartedAt);
        return { user: { ...user, isTrialing }, token };
    },

    /** Issue a fresh token for an already-authenticated user (sliding session). */
    async refreshToken(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "8h" });
        return { token };
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
            data: {
                ...data,
                role: data.role as any
            }
        });
    },

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                passwordHash: true
            }
        });

        if (!user || !user.passwordHash) {
            throw new Error("User not found");
        }

        const currentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!currentPasswordValid) {
            throw new Error("Current password is incorrect");
        }

        const isSameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
        if (isSameAsCurrent) {
            throw new Error("New password must be different from current password");
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        return { message: "Password changed successfully" };
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
    },

    async verifyEmail(email: string, token: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || (user as any).verificationToken !== token) {
            throw new Error("Invalid or expired verification token");
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: null,
                emailVerifiedAt: new Date()
            } as any
        });


        return { message: "Email verified successfully" };
    }
};

