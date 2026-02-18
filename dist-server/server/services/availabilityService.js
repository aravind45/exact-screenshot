import { prisma } from '../db.js';
/**
 * Parse "HH:mm" string to minutes-since-midnight
 */
function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}
/**
 * Format minutes-since-midnight back to "HH:mm"
 */
function minutesToTime(m) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
/**
 * Convert a local date + HH:mm time to UTC Date using the given IANA timezone
 */
function localToUtc(dateStr, timeStr, tz) {
    // Create a date string in the local timezone then convert to UTC
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    // Use Intl to figure out the UTC offset for that timezone on that date
    const local = new Date(year, month - 1, day, hour, minute, 0, 0);
    // Get what UTC time corresponds to this local time in the given tz
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    // Calculate the offset by comparing UTC now to formatted now in the target tz
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).formatToParts(utcDate);
    const p = {};
    for (const part of parts) {
        if (['year', 'month', 'day', 'hour', 'minute', 'second'].includes(part.type)) {
            p[part.type] = parseInt(part.value);
        }
    }
    const tzDisplayedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const offset = tzDisplayedAsUtc - Date.UTC(year, month - 1, day, hour, minute);
    const adjustedUtc = new Date(Date.UTC(year, month - 1, day, hour, minute) - offset);
    return adjustedUtc;
}
export class AvailabilityService {
    /**
     * Get available slots for an advisor on a specific date
     * @param advisorId - The AdvisorProfile.id
     * @param dateStr   - "YYYY-MM-DD" in the advisor's timezone
     * @param durationMinutes - how long the session is
     */
    static async getSlotsForDate(advisorId, dateStr, durationMinutes) {
        const advisor = await prisma.advisorProfile.findUnique({
            where: { id: advisorId },
            select: {
                timezone: true,
                bufferMinutes: true,
                maxSessionsPerDay: true,
                availabilityRules: {
                    where: { isActive: true }
                },
                availabilityExceptions: {
                    where: {
                        date: new Date(dateStr)
                    }
                }
            }
        });
        if (!advisor)
            throw new Error('Advisor not found');
        const tz = advisor.timezone || 'America/New_York';
        const buffer = advisor.bufferMinutes || 0;
        // Parse the date to get day of week (in the advisor's timezone)
        const [year, month, day] = dateStr.split('-').map(Number);
        const localDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        const tzParts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            weekday: 'short'
        }).formatToParts(localDate);
        const weekdayStr = tzParts.find(p => p.type === 'weekday')?.value;
        const weekdayMap = {
            Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
        };
        const dayOfWeek = weekdayMap[weekdayStr || 'Mon'] ?? 1;
        // Check for exception on this date
        const exception = advisor.availabilityExceptions[0];
        if (exception?.isBlackout) {
            return []; // Blackout day
        }
        // Get working hours — exception override OR weekly rule
        let windowStart;
        let windowEnd;
        if (exception && !exception.isBlackout && exception.startTime && exception.endTime) {
            windowStart = exception.startTime;
            windowEnd = exception.endTime;
        }
        else {
            const rule = advisor.availabilityRules.find(r => r.dayOfWeek === dayOfWeek);
            if (!rule)
                return []; // No rule for this day
            windowStart = rule.startTime;
            windowEnd = rule.endTime;
        }
        // Generate all possible slots
        const windowStartMins = timeToMinutes(windowStart);
        const windowEndMins = timeToMinutes(windowEnd);
        const slotStep = durationMinutes + buffer;
        const potentialSlots = [];
        let cursor = windowStartMins;
        while (cursor + durationMinutes <= windowEndMins) {
            const slotEndMins = cursor + durationMinutes;
            const startUtc = localToUtc(dateStr, minutesToTime(cursor), tz);
            const endUtc = localToUtc(dateStr, minutesToTime(slotEndMins), tz);
            potentialSlots.push({
                startTime: startUtc,
                endTime: endUtc,
                startLocal: minutesToTime(cursor),
                endLocal: minutesToTime(slotEndMins),
                available: true
            });
            cursor += slotStep;
        }
        if (potentialSlots.length === 0)
            return [];
        // Fetch conflicting bookings for the day (with buffer)
        const dayStart = localToUtc(dateStr, '00:00', tz);
        const dayEnd = localToUtc(dateStr, '23:59', tz);
        const existingBookings = await prisma.booking.findMany({
            where: {
                advisorId,
                status: { in: ['REQUESTED', 'CONFIRMED'] },
                startTime: { gte: dayStart, lte: dayEnd }
            },
            select: { startTime: true, endTime: true }
        });
        // Count bookings for max sessions check
        if (existingBookings.length >= (advisor.maxSessionsPerDay || 8)) {
            return potentialSlots.map(s => ({ ...s, available: false }));
        }
        // Remove conflicting slots
        return potentialSlots.map(slot => {
            const slotStartMs = slot.startTime.getTime();
            const slotEndMs = slot.endTime.getTime();
            const bufferMs = buffer * 60 * 1000;
            const conflict = existingBookings.some(b => {
                const bStart = b.startTime.getTime() - bufferMs;
                const bEnd = b.endTime.getTime() + bufferMs;
                return slotStartMs < bEnd && slotEndMs > bStart;
            });
            return { ...slot, available: !conflict };
        });
    }
    /**
     * Get available slots for a date range (for calendar rendering)
     */
    static async getSlotsForRange(advisorId, fromDate, toDate, durationMinutes) {
        const result = {};
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const cursor = new Date(from);
        while (cursor <= to) {
            const dateStr = cursor.toISOString().split('T')[0];
            const slots = await this.getSlotsForDate(advisorId, dateStr, durationMinutes);
            result[dateStr] = slots;
            cursor.setDate(cursor.getDate() + 1);
        }
        return result;
    }
    /**
     * Check if a specific slot (startTime + endTime) is available
     * Used during booking creation for conflict detection
     */
    static async isSlotAvailable(advisorId, startTime, endTime) {
        const conflict = await prisma.booking.findFirst({
            where: {
                advisorId,
                status: { in: ['REQUESTED', 'CONFIRMED'] },
                OR: [
                    { startTime: { lt: endTime }, endTime: { gt: startTime } }
                ]
            }
        });
        return !conflict;
    }
}
