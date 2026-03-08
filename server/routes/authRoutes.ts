import { Router, Request, Response } from "express";
import { AuthService } from "../services/authService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { calculateIsTrialing } from "../utils/trialUtils.js";

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    state: z.string().length(2).optional(),
    role: z.enum(["EXECUTOR", "ADVISOR", "HEIR"]).optional(),
    userType: z.enum(["EXECUTOR", "ADVISOR", "HEIR"]).optional(),
    deceasedName: z.string().optional(),
    estimatedValue: z.string().optional()
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

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
});

const verifyEmailSchema = z.object({
    email: z.string().email(),
    token: z.string()
});

// Middleware inside index.ts will handle global authentication if needed,
// but for specific routes, we can use it here.
// For now, these are the public auth routes.

router.post("/register", async (req: Request, res: Response) => {
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
            deceasedName: validated.deceasedName,
            estimatedValue: validated.estimatedValue,
            ip: Array.isArray(ip) ? ip[0] : ip
        });
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error("Register Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

router.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const result = await AuthService.login(email, password, Array.isArray(ip) ? ip[0] : ip);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        logger.error("Login Error:", error.message);
        res.status(401).json({ error: "Invalid email or password" });
    }
});

router.post("/forgot-password", async (req: Request, res: Response) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const result = await AuthService.forgotPassword(email);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid email" });
        }
        logger.error("Forgot Password Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

router.post("/reset-password", async (req: Request, res: Response) => {
    try {
        const validated = resetPasswordSchema.parse(req.body);
        const result = await AuthService.resetPassword({
            email: validated.email,
            token: validated.token,
            newPassword: validated.newPassword
        });
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        logger.error("Reset Password Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

router.post("/change-password", authenticate, async (req: any, res: Response) => {
    try {
        const validated = changePasswordSchema.parse(req.body);
        const result = await AuthService.changePassword(req.user.id, validated.currentPassword, validated.newPassword);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        logger.error("Change Password Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

router.post("/verify-email", async (req: Request, res: Response) => {
    try {
        const { email, token } = verifyEmailSchema.parse(req.body);
        const result = await AuthService.verifyEmail(email, token);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid input" });
        }
        logger.error("Verify Email Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

// Logout does NOT require authenticate middleware — allows expired tokens to be blacklisted too
router.post("/logout", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (token && token !== 'null' && token !== 'undefined') {
            // Add token to blacklist — expires in 8 hours (matches JWT expiry)
            await prisma.tokenBlacklist.create({
                data: {
                    token,
                    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
                }
            });
            logger.debug(`✅ [AUTH] Token blacklisted on logout`);
        }
        res.json({ message: "Logged out successfully" });
    } catch (error: any) {
        logger.error("Logout Error:", error.message);
        // Still return success — client should clear token regardless
        res.json({ message: "Logged out successfully" });
    }
});

// Token refresh — sliding session: active users get a fresh 8h token
router.post("/refresh", authenticate, async (req: any, res: Response) => {
    try {
        const oldToken = req.headers.authorization?.split(" ")[1];
        const result = await AuthService.refreshToken(req.user.id);

        // Blacklist the old token so it can't be reused
        if (oldToken) {
            await prisma.tokenBlacklist.create({
                data: {
                    token: oldToken,
                    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
                }
            }).catch(() => { }); // Ignore if already blacklisted
        }

        res.json(result);
    } catch (error: any) {
        logger.error("Refresh Token Error:", error.message);
        res.status(401).json({ error: "Failed to refresh token" });
    }
});

router.get("/me", authenticate, async (req: any, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: "Not authenticated" });

        const isTrialing = calculateIsTrialing(user.trialStartedAt);
        res.json({ ...user, isTrialing });
    } catch (error: any) {
        logger.error("Get Me Error:", error.message);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

router.post("/resend-verification", authenticate, async (req: any, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Not authenticated" });
        const result = await AuthService.resendVerification(req.user.id);
        res.json(result);
    } catch (error: any) {
        logger.error("Resend Verification Error:", error.message);
        res.status(500).json({ error: "Failed to resend verification email" });
    }
});

export default router;



