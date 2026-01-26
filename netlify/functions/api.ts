import serverless from 'serverless-http';
import app from '../../server/index.js';

console.log("API Function: Initialization starting...");

export const handler = async (event: any, context: any) => {
    console.log(`API Function: Handling ${event.httpMethod} ${event.path}`);
    console.log("API Function: DATABASE_URL present:", !!process.env.DATABASE_URL);
    console.log("API Function: JWT_SECRET present:", !!process.env.JWT_SECRET);
    try {
        const handler = serverless(app);
        return await handler(event, context);
    } catch (error) {
        console.error("API Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error during function execution" })
        };
    }
};
