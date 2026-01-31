import { prisma } from "../db.js";
export const DeadlineService = {
    async getDeadlines(estateId) {
        return await prisma.deadline.findMany({
            where: { estateId },
            orderBy: { dueDate: 'asc' }
        });
    },
    async createDeadline(estateId, data) {
        return await prisma.deadline.create({
            data: {
                estateId,
                title: data.title,
                dueDate: data.dueDate,
                isStatutory: data.isStatutory || false
            }
        });
    },
    async updateDeadline(id, estateId, data) {
        const deadline = await prisma.deadline.findFirst({ where: { id, estateId } });
        if (!deadline)
            throw new Error("Deadline not found");
        return await prisma.deadline.update({
            where: { id },
            data
        });
    },
    async deleteDeadline(id, estateId) {
        const deadline = await prisma.deadline.findFirst({ where: { id, estateId } });
        if (!deadline)
            throw new Error("Deadline not found");
        return await prisma.deadline.delete({ where: { id } });
    },
    async generateStatutoryDeadlines(estateId) {
        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        if (!estate)
            throw new Error("Estate not found");
        const dod = estate.deceasedDateOfDeath;
        if (!dod)
            return []; // Can't generate without DOD
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
