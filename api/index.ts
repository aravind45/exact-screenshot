console.log("⚡ Vercel Function Triggered: api/index.ts");
import app from '../server/index.js';

// Boot check for JWT secret (Hyper-Granular)
const secretStatus = process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length} chars, starts with ${process.env.JWT_SECRET.substring(0, 2)})` : "MISSING (using fallback)";
console.log(`🔑 [BOOT] JWT_SECRET status: ${secretStatus}`);

export default app;
