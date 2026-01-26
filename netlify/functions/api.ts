import serverless from 'serverless-http';
import app from '../../server/index.js';

console.log("API Function: Initialization starting...");

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
    console.log(`API Function: Handling ${event.httpMethod} ${event.path}`);

    try {
        return await serverlessHandler(event, context);
    } catch (error: any) {
        console.error("API Function Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: `Runtime Error: ${errorMessage}`,
                details: errorMessage,
                stack: error instanceof Error ? error.stack : undefined
            })
        };
    }
};
