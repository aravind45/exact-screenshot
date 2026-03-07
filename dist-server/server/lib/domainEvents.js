import { EventEmitter } from "node:events";
import { logger } from "./logger.js";
const domainEmitter = new EventEmitter();
domainEmitter.setMaxListeners(50);
export function emitDomainEvent(eventName, payload) {
    domainEmitter.emit(eventName, payload);
}
export function onDomainEvent(eventName, handler) {
    const wrapped = (payload) => {
        Promise.resolve(handler(payload)).catch((error) => {
            logger.error({
                eventName,
                payload,
                error: error instanceof Error ? error.message : String(error),
            }, "Domain event handler failed");
        });
    };
    domainEmitter.on(eventName, wrapped);
    return () => {
        domainEmitter.off(eventName, wrapped);
    };
}
