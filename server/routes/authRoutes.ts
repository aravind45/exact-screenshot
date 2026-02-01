import { Router, Request, Response } from "express";
import { AuthService } from "../services/authService.js";

const router = Router();

// Middleware inside index.ts will handle global authentication if needed,
// but for specific routes, we can use it here.
// For now, these are the public auth routes.

router.post("/register", async (req: Request, res: Response) => {
    try {
        const result = await AuthService.register(req.body);
        res.json(result);
    } catch (error: any) {
        console.error("Register Error:", error);
        res.status(400).json({ error: error.message });
    }
});

router.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        res.json(result);
    } catch (error: any) {
        console.error("Login Error:", error);
        res.status(401).json({ error: error.message });
    }
});

router.post("/forgot-password", async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const result = await AuthService.forgotPassword(email);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post("/reset-password", async (req: Request, res: Response) => {
    try {
        const result = await AuthService.resetPassword(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// The /me route requires authentication, which is handled in index.ts for simplicity
// or we can export a middleware.

export default router;
