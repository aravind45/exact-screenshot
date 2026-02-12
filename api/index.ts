console.log("⚡ Vercel Function Triggered: api/index.ts");
import app from '../server/index.js';

// Boot check for JWT secret (Sanitized)
const secretStatus = process.env.JWT_SECRET ? "SET" : "MISSING";
console.log(`🔑 [BOOT] JWT_SECRET status: ${secretStatus}`);

export default app;
