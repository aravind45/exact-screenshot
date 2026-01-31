import { prisma } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
export const AuthService = {
    async register(data) {
        const { email, password, fullName, state } = data;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            throw new Error("Email already registered");
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                state,
                role: 'EXECUTOR'
            }
        });
        // Create an initial estate for the user
        await prisma.estate.create({
            data: {
                userId: user.id,
                name: `${fullName || 'My'}'s Estate`,
                deceasedFirstName: "TBD",
                deceasedLastName: "TBD",
                deceasedDateOfDeath: new Date(),
                deceasedState: state || "CA",
                probateStatus: "NOT_STARTED"
            }
        });
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        return { user, token };
    },
    async login(email, password) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password");
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            throw new Error("Invalid email or password");
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        return { user, token };
    },
    async verifyToken(token) {
        try {
            console.log("🔑 Verifying token...");
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log(`👤 Token decoded for user: ${decoded.userId}`);
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user)
                console.log("👤 User not found in database");
            return user;
        }
        catch (error) {
            console.error("🔑 JWT Verification Error:", error.message);
            return null;
        }
    },
    async updateProfile(userId, data) {
        return await prisma.user.update({
            where: { id: userId },
            data
        });
    }
};
