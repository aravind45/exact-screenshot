import { EventEmitter } from "node:events";
import { logger } from "./logger.js";

export interface DomainEventMap {
  "estate.status.changed": {
    estateId: string;
    previousProbateStatus?: string | null;
    nextProbateStatus?: string | null;
    triggeredByUserId?: string;
  };
}

type DomainEventName = keyof DomainEventMap;
type DomainEventHandler<E extends DomainEventName> = (
  payload: DomainEventMap[E]
) => void | Promise<void>;

const domainEmitter = new EventEmitter();
domainEmitter.setMaxListeners(50);

export function emitDomainEvent<E extends DomainEventName>(
  eventName: E,
  payload: DomainEventMap[E]
): void {
  domainEmitter.emit(eventName, payload);
}

export function onDomainEvent<E extends DomainEventName>(
  eventName: E,
  handler: DomainEventHandler<E>
): () => void {
  const wrapped = (payload: DomainEventMap[E]) => {
    Promise.resolve(handler(payload)).catch((error) => {
      logger.error(
        {
          eventName,
          payload,
          error: error instanceof Error ? error.message : String(error),
        },
        "Domain event handler failed"
      );
    });
  };

  domainEmitter.on(eventName, wrapped as (payload: DomainEventMap[E]) => void);

  return () => {
    domainEmitter.off(eventName, wrapped as (payload: DomainEventMap[E]) => void);
  };
}
