import { Router } from "express";
import { AuthService } from "../services/authService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../db.js";
const router = Router();
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    state: z.string().length(2).optional(),
    role: z.enum(["EXECUTOR", "ADVISOR"]).optional(),
    userType: z.enum(["EXECUTOR", "ADVISOR"]).optional()
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});
const forgotPasswordSchema = z.object({
    email: z.string().email()
});
const resetPasswordSchema = z.object({
    email: z.string().email(),
    token: z.string(),
    newPassword: z.string().min(8)
});
// Middleware inside index.ts will handle global authentication if needed,
// but for specific routes, we can use it here.
// For now, these are the public auth routes.
router.post("/register", async (req, res) => {
    try {
        const validated = registerSchema.parse(req.body);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const result = await AuthService.register({
            email: validated.email,
            password: validated.password,
            fullName: validated.fullName,
            state: validated.state,
            role: validated.role,
            userType: validated.userType,
            ip: Array.isArray(ip) ? ip[0] : ip
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error("Register Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const result = await AuthService.login(email, password, Array.isArray(ip) ? ip[0] : ip);
        res.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        logger.error("Login Error:", error.message);
        res.status(401).json({ error: "Invalid email or password" });
    }
});
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const result = await AuthService.forgotPassword(email);
        res.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid email" });
        }
        logger.error("Forgot Password Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});
router.post("/reset-password", async (req, res) => {
    try {
        const validated = resetPasswordSchema.parse(req.body);
        const result = await AuthService.resetPassword({
            email: validated.email,
            token: validated.token,
            newPassword: validated.newPassword
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        logger.error("Reset Password Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});
router.post("/logout", authenticate, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            // Add token to blacklist - expires in 30 days (same as JWT expiry)
            await prisma.tokenBlacklist.create({
                data: {
                    token,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
            logger.debug(`✅ [AUTH] Token blacklisted for user: ${req.user?.id}`);
        }
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        logger.error("Logout Error:", error.message);
        res.status(500).json({ error: "Logout failed" });
    }
});
// The /me route requires authentication, which is handled in index.ts for simplicity
// or we can export a middleware.
export default router;
