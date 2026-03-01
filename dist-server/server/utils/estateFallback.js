export const fetchEstateRowById = async (client, estateId) => {
    const estate = await client.estate.findUnique({
        where: { id: estateId }
    });
    if (!estate)
        return null;
    return estate;
};
export const fetchEstateRowForUser = async (client, userId) => {
    const estate = await client.estate.findFirst({
        where: {
            OR: [
                { userId: userId },
                { grants: { some: { userId: userId } } }
            ]
        },
        orderBy: { createdAt: "desc" }
    });
    if (!estate)
        return null;
    return estate;
};
