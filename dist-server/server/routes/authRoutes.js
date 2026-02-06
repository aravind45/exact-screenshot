import { Router } from "express";
import { AuthService } from "../services/authService.js";
const router = Router();
// Middleware inside index.ts will handle global authentication if needed,
// but for specific routes, we can use it here.
// For now, these are the public auth routes.
router.post("/register", async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const result = await AuthService.register({ ...req.body, ip: Array.isArray(ip) ? ip[0] : ip });
        res.json(result);
    }
    catch (error) {
        console.error("Register Error:", error);
        res.status(400).json({ error: error.message });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const result = await AuthService.login(email, password, Array.isArray(ip) ? ip[0] : ip);
        res.json(result);
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(401).json({ error: error.message });
    }
});
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const result = await AuthService.forgotPassword(email);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post("/reset-password", async (req, res) => {
    try {
        const result = await AuthService.resetPassword(req.body);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// The /me route requires authentication, which is handled in index.ts for simplicity
// or we can export a middleware.
export default router;
