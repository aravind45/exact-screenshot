import { Router, Request, Response } from "express";
import { AssetService } from "../services/assetService.js";

const router = Router();

// Note: Authentication middleware is applied to these routes in index.ts

router.get("/", async (req: any, res: Response) => {
    try {
        const assets = await AssetService.getAll(req.user.id);
        res.json(assets);
    } catch (error: any) {
        console.error("Error fetching assets:", error);
        res.status(500).json({ error: "Failed to fetch assets" });
    }
});

router.get("/:id", async (req: any, res: Response) => {
    try {
        const asset = await AssetService.getById(req.params.id, req.user.id);
        if (!asset) return res.status(404).json({ error: "Asset not found" });
        res.json(asset);
    } catch (error: any) {
        console.error("Error fetching asset:", error);
        res.status(500).json({ error: "Failed to fetch asset" });
    }
});

router.post("/", async (req: any, res: Response) => {
    try {
        const asset = await AssetService.create(req.user.id, req.body);
        res.json(asset);
    } catch (error: any) {
        console.error("Error creating asset:", error);
        res.status(400).json({ error: error.message });
    }
});

router.put("/:id", async (req: any, res: Response) => {
    try {
        const asset = await AssetService.update(req.params.id, req.user.id, req.body);
        res.json(asset);
    } catch (error: any) {
        console.error("Error updating asset:", error);
        res.status(403).json({ error: error.message });
    }
});

router.delete("/:id", async (req: any, res: Response) => {
    try {
        const result = await AssetService.delete(req.params.id, req.user.id);
        res.json(result);
    } catch (error: any) {
        console.error("Error deleting asset:", error);
        res.status(403).json({ error: error.message });
    }
});

export default router;
