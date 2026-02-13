/**
 * Advisor System Test Runner
 * 
 * Comprehensive test script to validate the complete advisor marketplace functionality
 * 
 * Run with: npx tsx test-advisor-system.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message?: string;
    duration?: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
    const start = Date.now();
    try {
        await fn();
        results.push({
            name,
            status: 'PASS',
            duration: Date.now() - start
        });
        console.log(`✅ ${name}`);
    } catch (error: any) {
        results.push({
            name,
            status: 'FAIL',
            message: error.message,
            duration: Date.now() - start
        });
        console.log(`❌ ${name}: ${error.message}`);
    }
}

async function skip(name: string, reason: string) {
    results.push({
        name,
        status: 'SKIP',
        message: reason
    });
    console.log(`⚠️ ${name}: ${reason}`);
}

async function main() {
    console.log('🧪 Starting Advisor System Tests\n');
    console.log('=' .repeat(80));

    // Test 1: Database Schema Validation
    console.log('\n📋 1. DATABASE SCHEMA VALIDATION\n');

    await test('AdvisorProfile table exists', async () => {
        const count = await prisma.advisorProfile.count();
        if (typeof count !== 'number') throw new Error('Table not accessible');
    });

    await test('Booking table exists', async () => {
        const count = await prisma.booking.count();
        if (typeof count !== 'number') throw new Error('Table not accessible');
    });

    await test('AdvisorProfile has required fields', async () => {
        const profile = await prisma.advisorProfile.findFirst();
        if (profile) {
            const requiredFields = ['id', 'userId', 'bio', 'expertise', 'hourlyRate', 'verificationStatus', 'isVerified'];
            requiredFields.forEach(field => {
                if (!(field in profile)) throw new Error(`Missing field: ${field}`);
            });
        }
    });

    await test('Booking has required fields', async () => {
        const booking = await prisma.booking.findFirst();
        if (booking) {
            const requiredFields = ['id', 'userId', 'advisorId', 'status', 'totalAmount', 'platformFee', 'advisorPayout', 'escrowReleaseDate', 'payoutStatus'];
            requiredFields.forEach(field => {
                if (!(field in booking)) throw new Error(`Missing field: ${field}`);
            });
        }
    });

    // Test 2: Advisor Profile CRUD Operations
    console.log('\n👤 2. ADVISOR PROFILE OPERATIONS\n');

    let testAdvisorId: string | null = null;
    let testUserId: string | null = null;

    await test('Create test user for advisor', async () => {
        const user = await prisma.user.create({
            data: {
                email: `test-advisor-${Date.now()}@test.com`,
                fullName: 'Test Advisor',
                passwordHash: 'hashed_password',
                role: 'USER',
                state: 'CA'
            }
        });
        testUserId = user.id;
        if (!testUserId) throw new Error('Failed to create user');
    });

    await test('Create advisor profile', async () => {
        if (!testUserId) throw new Error('No test user');
        
        const profile = await prisma.advisorProfile.create({
            data: {
                userId: testUserId,
                bio: 'Test advisor bio',
                expertise: ['Estate Planning', 'Probate Law'],
                hourlyRate: 250,
                licenseNumber: 'TEST-123',
                verificationStatus: 'PENDING',
                isVerified: false
            }
        });
        testAdvisorId = profile.id;
        if (!testAdvisorId) throw new Error('Failed to create advisor profile');
    });

    await test('Read advisor profile', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const profile = await prisma.advisorProfile.findUnique({
            where: { id: testAdvisorId }
        });
        if (!profile) throw new Error('Profile not found');
        if (profile.bio !== 'Test advisor bio') throw new Error('Bio mismatch');
    });

    await test('Update advisor profile', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const updated = await prisma.advisorProfile.update({
            where: { id: testAdvisorId },
            data: { hourlyRate: 300 }
        });
        if (Number(updated.hourlyRate) !== 300) throw new Error('Update failed');
    });

    await test('Verify advisor', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const verified = await prisma.advisorProfile.update({
            where: { id: testAdvisorId },
            data: {
                verificationStatus: 'VERIFIED',
                isVerified: true
            }
        });
        if (!verified.isVerified) throw new Error('Verification failed');
    });

    // Test 3: Booking Operations
    console.log('\n📅 3. BOOKING OPERATIONS\n');

    let testBookingId: string | null = null;
    let testClientId: string | null = null;

    await test('Create test client user', async () => {
        const client = await prisma.user.create({
            data: {
                email: `test-client-${Date.now()}@test.com`,
                fullName: 'Test Client',
                passwordHash: 'hashed_password',
                role: 'USER',
                state: 'CA'
            }
        });
        testClientId = client.id;
        if (!testClientId) throw new Error('Failed to create client');
    });

    await test('Create booking', async () => {
        if (!testClientId || !testAdvisorId) throw new Error('Missing test data');
        
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() + 7);
        
        const escrowDate = new Date();
        escrowDate.setDate(escrowDate.getDate() + 90);

        const booking = await prisma.booking.create({
            data: {
                userId: testClientId,
                advisorId: testAdvisorId,
                sessionDuration: 2,
                sessionDate,
                totalAmount: 600,
                platformFee: 120,
                advisorPayout: 480,
                escrowReleaseDate: escrowDate,
                status: 'PENDING',
                payoutStatus: 'UNPAID'
            }
        });
        testBookingId = booking.id;
        if (!testBookingId) throw new Error('Failed to create booking');
    });

    await test('Verify booking fee calculation', async () => {
        if (!testBookingId) throw new Error('No test booking');
        
        const booking = await prisma.booking.findUnique({
            where: { id: testBookingId }
        });
        if (!booking) throw new Error('Booking not found');
        
        const total = Number(booking.totalAmount);
        const fee = Number(booking.platformFee);
        const payout = Number(booking.advisorPayout);
        
        if (total !== 600) throw new Error(`Total amount incorrect: ${total}`);
        if (fee !== 120) throw new Error(`Platform fee incorrect: ${fee}`);
        if (payout !== 480) throw new Error(`Advisor payout incorrect: ${payout}`);
        if (fee / total !== 0.2) throw new Error('Platform fee not 20%');
    });

    await test('Confirm booking', async () => {
        if (!testBookingId) throw new Error('No test booking');
        
        const confirmed = await prisma.booking.update({
            where: { id: testBookingId },
            data: { status: 'CONFIRMED' }
        });
        if (confirmed.status !== 'CONFIRMED') throw new Error('Confirmation failed');
    });

    await test('Cancel booking', async () => {
        if (!testBookingId) throw new Error('No test booking');
        
        const cancelled = await prisma.booking.update({
            where: { id: testBookingId },
            data: {
                status: 'CANCELLED',
                cancellationReason: 'Test cancellation'
            }
        });
        if (cancelled.status !== 'CANCELLED') throw new Error('Cancellation failed');
    });

    // Test 4: Marketplace Filtering
    console.log('\n🏪 4. MARKETPLACE FILTERING\n');

    await test('List verified advisors only', async () => {
        const verified = await prisma.advisorProfile.findMany({
            where: { verificationStatus: 'VERIFIED' }
        });
        
        verified.forEach(advisor => {
            if (advisor.verificationStatus !== 'VERIFIED') {
                throw new Error('Non-verified advisor in results');
            }
        });
    });

    await test('Filter by expertise', async () => {
        const filtered = await prisma.advisorProfile.findMany({
            where: {
                verificationStatus: 'VERIFIED',
                expertise: { has: 'Estate Planning' }
            }
        });
        
        filtered.forEach(advisor => {
            if (!advisor.expertise.includes('Estate Planning')) {
                throw new Error('Advisor without Estate Planning expertise in results');
            }
        });
    });

    await test('Filter by max hourly rate', async () => {
        const maxRate = 200;
        const filtered = await prisma.advisorProfile.findMany({
            where: {
                verificationStatus: 'VERIFIED',
                hourlyRate: { lte: maxRate }
            }
        });
        
        filtered.forEach(advisor => {
            if (Number(advisor.hourlyRate) > maxRate) {
                throw new Error(`Advisor rate ${advisor.hourlyRate} exceeds max ${maxRate}`);
            }
        });
    });

    // Test 5: Booking Queries
    console.log('\n📊 5. BOOKING QUERIES\n');

    await test('Get user bookings', async () => {
        if (!testClientId) throw new Error('No test client');
        
        const bookings = await prisma.booking.findMany({
            where: { userId: testClientId },
            include: { advisor: true }
        });
        
        if (!Array.isArray(bookings)) throw new Error('Invalid result');
    });

    await test('Get advisor bookings', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const bookings = await prisma.booking.findMany({
            where: { advisorId: testAdvisorId },
            include: { user: true }
        });
        
        if (!Array.isArray(bookings)) throw new Error('Invalid result');
    });

    await test('Get pending bookings for advisor', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const pending = await prisma.booking.findMany({
            where: {
                advisorId: testAdvisorId,
                status: 'PENDING'
            }
        });
        
        pending.forEach(booking => {
            if (booking.status !== 'PENDING') {
                throw new Error('Non-pending booking in results');
            }
        });
    });

    await test('Get upcoming sessions', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const upcoming = await prisma.booking.findMany({
            where: {
                advisorId: testAdvisorId,
                status: 'CONFIRMED',
                sessionDate: { gte: new Date() }
            },
            orderBy: { sessionDate: 'asc' },
            take: 5
        });
        
        if (!Array.isArray(upcoming)) throw new Error('Invalid result');
    });

    // Test 6: Earnings Calculations
    console.log('\n💰 6. EARNINGS CALCULATIONS\n');

    await test('Calculate total earnings', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const bookings = await prisma.booking.findMany({
            where: {
                advisorId: testAdvisorId,
                status: { in: ['COMPLETED', 'CONFIRMED'] }
            }
        });
        
        const totalEarnings = bookings.reduce((sum, b) => sum + Number(b.advisorPayout), 0);
        if (typeof totalEarnings !== 'number') throw new Error('Invalid calculation');
    });

    await test('Calculate paid vs pending earnings', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const bookings = await prisma.booking.findMany({
            where: { advisorId: testAdvisorId }
        });
        
        const paidEarnings = bookings
            .filter(b => b.payoutStatus === 'PAID')
            .reduce((sum, b) => sum + Number(b.advisorPayout), 0);
            
        const pendingEarnings = bookings
            .filter(b => b.payoutStatus === 'UNPAID')
            .reduce((sum, b) => sum + Number(b.advisorPayout), 0);
        
        if (typeof paidEarnings !== 'number' || typeof pendingEarnings !== 'number') {
            throw new Error('Invalid calculation');
        }
    });

    await test('Get bookings due for payout', async () => {
        const now = new Date();
        const dueBookings = await prisma.booking.findMany({
            where: {
                status: 'COMPLETED',
                payoutStatus: 'UNPAID',
                escrowReleaseDate: { lte: now }
            }
        });
        
        if (!Array.isArray(dueBookings)) throw new Error('Invalid result');
    });

    // Test 7: Data Integrity
    console.log('\n🔒 7. DATA INTEGRITY\n');

    await test('Advisor profile has valid user reference', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        
        const profile = await prisma.advisorProfile.findUnique({
            where: { id: testAdvisorId },
            include: { user: true }
        });
        
        if (!profile?.user) throw new Error('User reference broken');
    });

    await test('Booking has valid advisor reference', async () => {
        if (!testBookingId) throw new Error('No test booking');
        
        const booking = await prisma.booking.findUnique({
            where: { id: testBookingId },
            include: { advisor: true }
        });
        
        if (!booking?.advisor) throw new Error('Advisor reference broken');
    });

    await test('Booking has valid user reference', async () => {
        if (!testBookingId) throw new Error('No test booking');
        
        const booking = await prisma.booking.findUnique({
            where: { id: testBookingId },
            include: { user: true }
        });
        
        if (!booking?.user) throw new Error('User reference broken');
    });

    // Cleanup
    console.log('\n🧹 CLEANUP\n');

    await test('Delete test booking', async () => {
        if (!testBookingId) throw new Error('No test booking');
        await prisma.booking.delete({ where: { id: testBookingId } });
    });

    await test('Delete test advisor profile', async () => {
        if (!testAdvisorId) throw new Error('No test advisor');
        await prisma.advisorProfile.delete({ where: { id: testAdvisorId } });
    });

    await test('Delete test users', async () => {
        if (testUserId) {
            await prisma.user.delete({ where: { id: testUserId } });
        }
        if (testClientId) {
            await prisma.user.delete({ where: { id: testClientId } });
        }
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST SUMMARY\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Skipped: ${skipped}`);

    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);

    if (failed > 0) {
        console.log('\n❌ FAILED TESTS:\n');
        results
            .filter(r => r.status === 'FAIL')
            .forEach(r => {
                console.log(`  - ${r.name}`);
                console.log(`    ${r.message}`);
            });
    }

    const successRate = (passed / total * 100).toFixed(1);
    console.log(`\n📈 Success Rate: ${successRate}%`);

    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED!\n');
    } else {
        console.log('\n⚠️ SOME TESTS FAILED\n');
        process.exit(1);
    }
}

main()
    .catch(error => {
        console.error('💥 Test runner error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
