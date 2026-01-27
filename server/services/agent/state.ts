import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * EstateState
 * 
 * Defines the state structure for the Estate Settlement Agent.
 * Tracks the current phase, completed tasks, assets, etc.
 */
export const EstateStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    phase: Annotation<string>(),
    estateId: Annotation<string>(),
    deceasedInfo: Annotation<any>(),
    completedTasks: Annotation<string[]>(),
    assets: Annotation<any[]>(),
    liabilities: Annotation<any[]>(),
    deadlines: Annotation<any[]>(),
    blockers: Annotation<any[]>(),
});

export type EstateState = typeof EstateStateAnnotation.State;
