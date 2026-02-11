const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
    log: (...args: any[]) => {
        if (!isProduction) {
            console.log(...args);
        }
    },
    info: (...args: any[]) => {
        if (!isProduction) {
            console.info(...args);
        }
    },
    warn: (...args: any[]) => {
        // We might want to see warnings in production but avoid PII
        console.warn(...args);
    },
    error: (...args: any[]) => {
        // Errors should always be logged for debugging production issues
        console.error(...args);
    },
    // Sensitive logging that should NEVER happen in production
    debug: (...args: any[]) => {
        if (!isProduction) {
            console.log("[DEBUG]", ...args);
        }
    }
};
