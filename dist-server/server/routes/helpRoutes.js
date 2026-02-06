import express from "express";
import { HelpService } from "../services/helpService.js";
const router = express.Router();
router.get("/recommendations/:estateId", async (req, res) => {
    try {
        const recommendations = await HelpService.getContextualRecommendations(req.params.estateId);
        res.json(recommendations);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to get recommendations" });
    }
});
router.post("/log", async (req, res) => {
    try {
        const { estateId, topic } = req.body;
        const log = await HelpService.logHelpReference(estateId, req.user.id, topic);
        res.json(log);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to log help reference" });
    }
});
export default router;
