import { Annotation } from "@langchain/langgraph";
/**
 * EstateState
 *
 * Defines the state structure for the Estate Settlement Agent.
 * Tracks the current phase, completed tasks, assets, etc.
 */
export const EstateStateAnnotation = Annotation.Root({
    messages: Annotation({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    phase: Annotation(),
    estateId: Annotation(),
    deceasedInfo: Annotation(),
    completedTasks: Annotation(),
    assets: Annotation(),
    liabilities: Annotation(),
    deadlines: Annotation(),
    blockers: Annotation(),
});
