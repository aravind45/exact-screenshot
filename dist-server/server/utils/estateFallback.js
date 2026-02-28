import { Prisma } from "@prisma/client";
let estateColumnCache = null;
const toCamelCase = (value) => value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const mapRowToEstate = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamelCase(key), value]));
const getEstateColumns = async (client) => {
    if (estateColumnCache)
        return estateColumnCache;
    const columns = await client.$queryRaw `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'estates'
  `;
    estateColumnCache = columns.map((column) => column.column_name);
    return estateColumnCache;
};
export const fetchEstateRowById = async (client, estateId) => {
    const columns = await getEstateColumns(client);
    if (columns.length === 0)
        return null;
    const selectFields = columns.map((column) => Prisma.raw(`e."${column}"`));
    const rows = await client.$queryRaw `
    SELECT ${Prisma.join(selectFields, ", ")}
    FROM "estates" e
    WHERE e.id = ${estateId}
    LIMIT 1
  `;
    if (!rows?.length)
        return null;
    return mapRowToEstate(rows[0]);
};
export const fetchEstateRowForUser = async (client, userId) => {
    const columns = await getEstateColumns(client);
    if (columns.length === 0)
        return null;
    const selectFields = columns.map((column) => Prisma.raw(`e."${column}"`));
    const rows = await client.$queryRaw `
    SELECT ${Prisma.join(selectFields, ", ")}
    FROM "estates" e
    LEFT JOIN "estate_grants" g
      ON g.estate_id = e.id AND g.user_id = ${userId}
    WHERE e.user_id = ${userId} OR g.user_id = ${userId}
    ORDER BY e.created_at DESC
    LIMIT 1
  `;
    if (!rows?.length)
        return null;
    return mapRowToEstate(rows[0]);
};
