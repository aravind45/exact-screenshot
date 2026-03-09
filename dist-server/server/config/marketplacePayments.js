export const ADVISOR_PLATFORM_FEE_PERCENT = 0.20;
export const ADVISOR_ESCROW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
export function calculateAdvisorEscrowReleaseDate(from = new Date()) {
    return new Date(from.getTime() + ADVISOR_ESCROW_DAYS * MS_PER_DAY);
}
