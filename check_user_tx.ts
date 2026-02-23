import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: "texas123@gmail.com" },
            include: { estates: true }
        });

        if (!user) {
            console.log("User not found: texas123@gmail.com");
            return;
        }

        console.log("Found User:", { email: user.email, state: user.state });

        if (user.state !== "TX") {
            await prisma.user.update({
                where: { id: user.id },
                data: { state: "TX" }
            });
            console.log("Updated user state to TX");
        }

        for (const estate of user.estates) {
            if (estate.deceasedState !== "TX") {
                await prisma.estate.update({
                    where: { id: estate.id },
                    data: { deceasedState: "TX" }
                });
                console.log(`Updated estate ${estate.id} state to TX`);
            }
        }
    } catch (error) {
        console.error("Error querying database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
