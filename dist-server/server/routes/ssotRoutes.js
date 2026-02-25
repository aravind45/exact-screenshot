/**
 * SSOT Probate Engine API Routes
 * Full admin CRUD for jurisdictions, roadmaps, phases, steps, actions, forms, taxonomy, tax
 */
import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { RoleUtils } from '../utils/userUtils.js';
import * as JurisdictionSvc from '../services/ssot/jurisdictionService.js';
import * as RoadmapSvc from '../services/ssot/roadmapService.js';
import * as FormsTaxSvc from '../services/ssot/formsAndTaxService.js';
import * as GapSvc from '../services/ssot/gapDetectionService.js';
const router = Router();
const isAdmin = (req, res, next) => {
    if (!req.user || !RoleUtils.isAdmin(req.user)) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
    logger.error(`SSOT Error: ${e.message}`);
    res.status(500).json({ error: e.message });
});
// ══════ STATS & GAP DETECTION ══════
router.get('/stats', isAdmin, wrap(async (req, res) => {
    res.json(await GapSvc.getSSOTStats());
}));
router.get('/gaps', isAdmin, wrap(async (req, res) => {
    res.json(await GapSvc.runFullGapAnalysis());
}));
router.get('/state-completeness', isAdmin, wrap(async (req, res) => {
    res.json(await GapSvc.getStateCompleteness());
}));
// ══════ JURISDICTIONS ══════
router.get('/jurisdictions', isAdmin, wrap(async (req, res) => {
    const status = req.query.status;
    res.json(await JurisdictionSvc.listJurisdictions(status));
}));
router.get('/jurisdictions/:id', isAdmin, wrap(async (req, res) => {
    const j = await JurisdictionSvc.getJurisdiction(req.params.id);
    j ? res.json(j) : res.status(404).json({ error: 'Not found' });
}));
router.post('/jurisdictions', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await JurisdictionSvc.upsertJurisdiction(req.body, req.user?.id));
}));
router.put('/jurisdictions/:id', isAdmin, wrap(async (req, res) => {
    res.json(await JurisdictionSvc.upsertJurisdiction({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/jurisdictions/:id', isAdmin, wrap(async (req, res) => {
    await JurisdictionSvc.deleteJurisdiction(req.params.id, req.user?.id);
    res.json({ success: true });
}));
router.post('/jurisdictions/:id/publish', isAdmin, wrap(async (req, res) => {
    await JurisdictionSvc.publishJurisdiction(req.params.id, req.user?.id);
    res.json({ success: true });
}));
// ══════ PROBATE TYPES ══════
router.get('/probate-types', isAdmin, wrap(async (req, res) => {
    res.json(await JurisdictionSvc.listProbateTypes());
}));
router.post('/probate-types', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await JurisdictionSvc.upsertProbateType(req.body, req.user?.id));
}));
router.put('/probate-types/:id', isAdmin, wrap(async (req, res) => {
    res.json(await JurisdictionSvc.upsertProbateType({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/probate-types/:id', isAdmin, wrap(async (req, res) => {
    await JurisdictionSvc.deleteProbateType(req.params.id, req.user?.id);
    res.json({ success: true });
}));
// ══════ ROADMAPS ══════
router.get('/roadmaps', isAdmin, wrap(async (req, res) => {
    const jurisdictionId = req.query.jurisdictionId;
    res.json(await RoadmapSvc.listRoadmaps(jurisdictionId));
}));
router.get('/roadmaps/:id', isAdmin, wrap(async (req, res) => {
    const r = await RoadmapSvc.getRoadmap(req.params.id);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
}));
router.get('/roadmaps/:id/full', isAdmin, wrap(async (req, res) => {
    const r = await RoadmapSvc.getRoadmapFull(req.params.id);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
}));
router.post('/roadmaps', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await RoadmapSvc.upsertRoadmap(req.body, req.user?.id));
}));
router.put('/roadmaps/:id', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.upsertRoadmap({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/roadmaps/:id', isAdmin, wrap(async (req, res) => {
    await RoadmapSvc.deleteRoadmap(req.params.id, req.user?.id);
    res.json({ success: true });
}));
router.post('/roadmaps/:id/publish', isAdmin, wrap(async (req, res) => {
    await RoadmapSvc.publishRoadmap(req.params.id, req.user?.id);
    res.json({ success: true });
}));
// ══════ ROADMAP VERSIONS (SSOT) ══════
router.get('/roadmap-versions', isAdmin, wrap(async (req, res) => {
    const settlementTypeCode = req.query.settlementTypeCode;
    const versions = await RoadmapSvc.listRoadmapVersions(settlementTypeCode);
    res.json(versions);
}));
router.post('/roadmap-versions', isAdmin, wrap(async (req, res) => {
    const result = await RoadmapSvc.createRoadmapVersion(req.body, req.user?.id);
    res.status(201).json(result);
}));
router.put('/roadmap-versions/:id/publish', isAdmin, wrap(async (req, res) => {
    const result = await RoadmapSvc.publishRoadmapVersion(req.params.id, req.user?.id);
    res.json(result);
}));
router.delete('/roadmap-versions/:id', isAdmin, wrap(async (req, res) => {
    await RoadmapSvc.deleteRoadmapVersion(req.params.id, req.user?.id);
    res.json({ success: true });
}));
// ══════ PHASES ══════
router.get('/roadmaps/:roadmapId/phases', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.listPhases(req.params.roadmapId));
}));
router.post('/phases', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await RoadmapSvc.upsertPhase(req.body, req.user?.id));
}));
router.put('/phases/:id', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.upsertPhase({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/phases/:id', isAdmin, wrap(async (req, res) => {
    await RoadmapSvc.deletePhase(req.params.id, req.user?.id);
    res.json({ success: true });
}));
// ══════ STEPS ══════
router.get('/phases/:phaseId/steps', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.listSteps(req.params.phaseId));
}));
router.post('/steps', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await RoadmapSvc.upsertStep(req.body, req.user?.id));
}));
router.put('/steps/:id', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.upsertStep({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/steps/:id', isAdmin, wrap(async (req, res) => {
    await RoadmapSvc.deleteStep(req.params.id, req.user?.id);
    res.json({ success: true });
}));
// ══════ STEP ACTIONS ══════
router.get('/steps/:stepId/actions', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.listStepActions(req.params.stepId));
}));
router.post('/actions', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await RoadmapSvc.upsertStepAction(req.body, req.user?.id));
}));
router.put('/actions/:id', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.upsertStepAction({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/actions/:id', isAdmin, wrap(async (req, res) => {
    await RoadmapSvc.deleteStepAction(req.params.id, req.user?.id);
    res.json({ success: true });
}));
// ══════ STEP DEPENDENCIES ══════
router.get('/steps/:stepId/dependencies', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.listStepDependencies(req.params.stepId));
}));
router.post('/dependencies', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await RoadmapSvc.addStepDependency(req.body));
}));
router.delete('/dependencies/:id', isAdmin, wrap(async (req, res) => {
    await RoadmapSvc.removeStepDependency(req.params.id);
    res.json({ success: true });
}));
// ══════ STEP FORMS (linking) ══════
router.get('/steps/:stepId/forms', isAdmin, wrap(async (req, res) => {
    res.json(await RoadmapSvc.listStepForms(req.params.stepId));
}));
router.post('/step-forms', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await RoadmapSvc.linkFormToStep(req.body));
}));
router.delete('/step-forms/:id', isAdmin, wrap(async (req, res) => {
    await RoadmapSvc.unlinkFormFromStep(req.params.id);
    res.json({ success: true });
}));
// ══════ LEGAL FORMS ══════
router.get('/forms', isAdmin, wrap(async (req, res) => {
    const jurisdictionId = req.query.jurisdictionId;
    res.json(await FormsTaxSvc.listLegalForms(jurisdictionId));
}));
router.post('/forms', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await FormsTaxSvc.upsertLegalForm(req.body, req.user?.id));
}));
router.put('/forms/:id', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.upsertLegalForm({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/forms/:id', isAdmin, wrap(async (req, res) => {
    await FormsTaxSvc.deleteLegalForm(req.params.id, req.user?.id);
    res.json({ success: true });
}));
// ══════ ASSET TYPES ══════
router.get('/asset-types', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.listAssetTypes());
}));
router.post('/asset-types', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await FormsTaxSvc.upsertAssetType(req.body, req.user?.id));
}));
router.put('/asset-types/:id', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.upsertAssetType({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/asset-types/:id', isAdmin, wrap(async (req, res) => {
    await FormsTaxSvc.deleteAssetType(req.params.id);
    res.json({ success: true });
}));
// ══════ LIABILITY TYPES ══════
router.get('/liability-types', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.listLiabilityTypes());
}));
router.post('/liability-types', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await FormsTaxSvc.upsertLiabilityType(req.body, req.user?.id));
}));
router.put('/liability-types/:id', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.upsertLiabilityType({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/liability-types/:id', isAdmin, wrap(async (req, res) => {
    await FormsTaxSvc.deleteLiabilityType(req.params.id);
    res.json({ success: true });
}));
// ══════ ACCOUNTING RULES ══════
router.get('/accounting-rules', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.listAccountingRules(req.query.jurisdictionId));
}));
router.post('/accounting-rules', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await FormsTaxSvc.upsertAccountingRule(req.body, req.user?.id));
}));
router.put('/accounting-rules/:id', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.upsertAccountingRule({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/accounting-rules/:id', isAdmin, wrap(async (req, res) => {
    await FormsTaxSvc.deleteAccountingRule(req.params.id);
    res.json({ success: true });
}));
// ══════ TAX OBLIGATIONS ══════
router.get('/tax-obligations', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.listTaxObligations(req.query.jurisdictionId));
}));
router.post('/tax-obligations', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await FormsTaxSvc.upsertTaxObligation(req.body, req.user?.id));
}));
router.put('/tax-obligations/:id', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.upsertTaxObligation({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/tax-obligations/:id', isAdmin, wrap(async (req, res) => {
    await FormsTaxSvc.deleteTaxObligation(req.params.id);
    res.json({ success: true });
}));
// ══════ DISTRIBUTION RULES ══════
router.get('/distribution-rules', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.listDistributionRules(req.query.jurisdictionId));
}));
router.post('/distribution-rules', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await FormsTaxSvc.upsertDistributionRule(req.body, req.user?.id));
}));
router.put('/distribution-rules/:id', isAdmin, wrap(async (req, res) => {
    res.json(await FormsTaxSvc.upsertDistributionRule({ ...req.body, id: req.params.id }, req.user?.id));
}));
router.delete('/distribution-rules/:id', isAdmin, wrap(async (req, res) => {
    await FormsTaxSvc.deleteDistributionRule(req.params.id);
    res.json({ success: true });
}));
// ══════ STATUTE REFERENCES ══════
router.get('/statute-references', isAdmin, wrap(async (req, res) => {
    const { entityType, entityId } = req.query;
    if (!entityType || !entityId)
        return res.status(400).json({ error: 'entityType and entityId required' });
    res.json(await JurisdictionSvc.listStatuteReferences(entityType, entityId));
}));
router.post('/statute-references', isAdmin, wrap(async (req, res) => {
    res.status(201).json(await JurisdictionSvc.upsertStatuteReference(req.body, req.user?.id));
}));
router.delete('/statute-references/:id', isAdmin, wrap(async (req, res) => {
    await JurisdictionSvc.deleteStatuteReference(req.params.id);
    res.json({ success: true });
}));
// ══════ CHANGE LOGS ══════
router.get('/change-logs', isAdmin, wrap(async (req, res) => {
    const { entityType, entityId, limit } = req.query;
    res.json(await FormsTaxSvc.getChangeLogs(entityType, entityId, Number(limit) || 50));
}));
export default router;
