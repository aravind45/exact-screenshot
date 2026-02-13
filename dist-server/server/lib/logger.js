const isProduction = process.env.NODE_ENV === 'production';
export const logger = {
    log: (...args) => {
        if (!isProduction) {
            console.log(...args);
        }
    },
    info: (...args) => {
        if (!isProduction) {
            console.info(...args);
        }
    },
    warn: (...args) => {
        // We might want to see warnings in production but avoid PII
        console.warn(...args);
    },
    error: (...args) => {
        // Errors should always be logged for debugging production issues
        console.error(...args);
    },
    // Sensitive logging that should NEVER happen in production
    debug: (...args) => {
        if (!isProduction) {
            console.log("[DEBUG]", ...args);
        }
    }
};
