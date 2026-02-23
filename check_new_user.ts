import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkNewUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: "texas_new_12@example.com" },
            include: { estates: true }
        });

        if (!user) {
            console.log("User not found: texas_new_12@example.com");
            return;
        }

        console.log("User found:", {
            email: user.email,
            state: user.state,
        });

        if (user.estates.length > 0) {
            user.estates.forEach((estate, index) => {
                console.log(`Estate ${index + 1}:`, {
                    deceasedState: estate.deceasedState,
                    deceasedFirstName: estate.deceasedFirstName,
                    deceasedLastName: estate.deceasedLastName,
                    estimatedPersonalProperty: estate.estimatedPersonalProperty
                });
            });
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNewUser();
