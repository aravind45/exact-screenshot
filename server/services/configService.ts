import { prisma } from "../db.js";

export const ConfigService = {
    async get(key: string) {
        const setting = await prisma.appSetting.findUnique({ where: { key } });
        return setting?.value || process.env[key]; // Fallback to process.env
    },

    async set(key: string, value: string, isSecret: boolean = false) {
        return await prisma.appSetting.upsert({
            where: { key },
            update: { value, isSecret },
            create: { key, value, isSecret }
        });
    },

    async getAll() {
        return await prisma.appSetting.findMany();
    }
};
