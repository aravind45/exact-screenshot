import serverless from 'serverless-http';

console.log("API Function: Initialization starting...");

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
    console.log(`API Function: Handling ${event.httpMethod} ${event.path}`);
    console.log("API Function: DATABASE_URL present:", !!process.env.DATABASE_URL);
    console.log("API Function: JWT_SECRET present:", !!process.env.JWT_SECRET);

    try {
        if (!cachedHandler) {
            console.log("API Function: Importing app...");
            const { default: app } = await import('../../server/index.js');
            cachedHandler = serverless(app);
            console.log("API Function: App imported and handler cached.");
        }

        return await cachedHandler(event, context);
    } catch (error) {
        console.error("API Function Crash:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "Internal Server Error: Application failed to start",
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            })
        };
    }
};
