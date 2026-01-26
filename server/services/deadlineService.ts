import { prisma } from "../db.js";

export const DeadlineService = {
    async getDeadlines(estateId: string) {
        return await prisma.deadline.findMany({
            where: { estateId },
            orderBy: { dueDate: 'asc' }
        });
    },

    async createDeadline(estateId: string, data: { title: string, dueDate: Date, isStatutory?: boolean }) {
        return await prisma.deadline.create({
            data: {
                estateId,
                title: data.title,
                dueDate: data.dueDate,
                isStatutory: data.isStatutory || false
            }
        });
    },

    async updateDeadline(id: string, estateId: string, data: Partial<{ title: string, dueDate: Date, status: string }>) {
        const deadline = await prisma.deadline.findFirst({ where: { id, estateId } });
        if (!deadline) throw new Error("Deadline not found");

        return await prisma.deadline.update({
            where: { id },
            data
        });
    },

    async deleteDeadline(id: string, estateId: string) {
        const deadline = await prisma.deadline.findFirst({ where: { id, estateId } });
        if (!deadline) throw new Error("Deadline not found");

        return await prisma.deadline.delete({ where: { id } });
    },

    async generateStatutoryDeadlines(estateId: string) {
        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        if (!estate) throw new Error("Estate not found");

        const dod = estate.deceasedDateOfDeath;
        if (!dod) return []; // Can't generate without DOD

        // Common CA Probate Deadlines (Simplified)
        const deadlines = [
            { title: "File Petition for Probate", months: 1 },
            { title: "File Inventory & Appraisal", months: 4 },
            { title: "Creditor Claim Period Ends", months: 4 }, // Technically 4 months after letters, but approximating
        ];

        const created = [];
        for (const d of deadlines) {
            const dueDate = new Date(dod);
            dueDate.setMonth(dueDate.getMonth() + d.months);

            // Check if exists
            const existing = await prisma.deadline.findFirst({
                where: { estateId, title: d.title }
            });

            if (!existing) {
                created.push(await this.createDeadline(estateId, {
                    title: d.title,
                    dueDate,
                    isStatutory: true
                }));
            }
        }
        return created;
    }
};
