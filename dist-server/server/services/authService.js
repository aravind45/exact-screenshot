import { prisma } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { EmailService } from "./emailService.js";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
export const AuthService = {
    async register(data) {
        const { email, password, fullName, state, ip } = data;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            throw new Error("Email already registered");
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
        return { user, token };
    },
    async verifyToken(token) {
        try {
            if (!token || token === 'null' || token === 'undefined') {
                console.log("🔑 verifyToken called with empty/invalid token string");
                return null;
            }
            console.log(`🔑 Verifying token (len: ${token.length}). Secret prefix: ${JWT_SECRET.substring(0, 3)}...`);
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log(`👤 JWT Valid. Decoded userId: ${decoded.userId}`);
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user) {
                console.log(`❌ DB Lookup: User ${decoded.userId} not found in database`);
                return null;
            }
            return user;
        }
        catch (error) {
            console.error("🔑 JWT Verification Failed:", error.message);
            if (error.name === 'TokenExpiredError') {
                console.log("⏰ Token expired at:", error.expiredAt);
            }
            return null;
        }
    },
    async updateProfile(userId, data) {
        return await prisma.user.update({
            where: { id: userId },
            data
        });
    },
    async forgotPassword(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new Error("No user found with this email");
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
    async resetPassword(data) {
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
