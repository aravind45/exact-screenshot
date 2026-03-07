import { onDomainEvent } from "../lib/domainEvents.js";
import { logger } from "../lib/logger.js";
import { AssetService } from "./assetService.js";
const EXECUTOR_APPOINTED = "EXECUTOR_APPOINTED";
let handlersRegistered = false;
const unsubscribeHandlers = [];
export function registerAssetDomainEventHandlers() {
    if (handlersRegistered) {
        return;
    }
    handlersRegistered = true;
    const unsubscribe = onDomainEvent("estate.status.changed", async (event) => {
        if (event.nextProbateStatus !== EXECUTOR_APPOINTED) {
            return;
        }
        if (event.previousProbateStatus === EXECUTOR_APPOINTED) {
            return;
        }
        const result = await AssetService.autoSyncAssetsForEstate(event.estateId);
        logger.info({
            estateId: event.estateId,
            updatedAssetCount: result.count,
            previousProbateStatus: event.previousProbateStatus,
            nextProbateStatus: event.nextProbateStatus,
        }, "Auto-synced assets from estate status change event");
    });
    unsubscribeHandlers.push(unsubscribe);
}
export function unregisterAssetDomainEventHandlers() {
    while (unsubscribeHandlers.length > 0) {
        const unsubscribe = unsubscribeHandlers.pop();
        unsubscribe?.();
    }
    handlersRegistered = false;
}
