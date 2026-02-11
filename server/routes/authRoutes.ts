import { Router, Request, Response } from "express";
import { AuthService } from "../services/authService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    state: z.string().length(2).optional()
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

router.post("/register", async (req: Request, res: Response) => {
    try {
        const validated = registerSchema.parse(req.body);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const result = await AuthService.register({
            email: validated.email,
            password: validated.password,
            fullName: validated.fullName,
            state: validated.state,
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

// The /me route requires authentication, which is handled in index.ts for simplicity
// or we can export a middleware.

export default router;
