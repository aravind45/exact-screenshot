import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';

/**
 * Middleware to require ADMIN role
 */
export const requireAdmin = async (req: any, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role !== 'ADMIN') {
            logger.warn(`Unauthorized admin access attempt by user ${req.user.id}`);
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error: any) {
        logger.error('Authorization error:', error.message);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

/**
 * Middleware to require ADVISOR role
 */
export const requireAdvisor = async (req: any, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user has an advisor profile
        const advisorProfile = await prisma.advisorProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!advisorProfile) {
            logger.warn(`Non-advisor access attempt by user ${req.user.id}`);
            return res.status(403).json({ error: 'Advisor profile required' });
        }

        // Attach advisor profile to request for convenience
        req.advisor = advisorProfile;

        next();
    } catch (error: any) {
        logger.error('Authorization error:', error.message);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

/**
 * Middleware to require ADVISOR or ADMIN role
 */
export const requireAdvisorOrAdmin = async (req: any, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if admin
        if (req.user.role === 'ADMIN') {
            return next();
        }

        // Check if advisor
        const advisorProfile = await prisma.advisorProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!advisorProfile) {
            logger.warn(`Unauthorized access attempt by user ${req.user.id}`);
            return res.status(403).json({ error: 'Advisor or admin access required' });
        }

        req.advisor = advisorProfile;
        next();
    } catch (error: any) {
        logger.error('Authorization error:', error.message);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

/**
 * Middleware to require verified advisor
 */
export const requireVerifiedAdvisor = async (req: any, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const advisorProfile = await prisma.advisorProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (!advisorProfile) {
            return res.status(403).json({ error: 'Advisor profile required' });
        }

        if (!advisorProfile.isVerified) {
            logger.warn(`Unverified advisor access attempt by user ${req.user.id}`);
            return res.status(403).json({ error: 'Verified advisor status required' });
        }

        req.advisor = advisorProfile;
        next();
    } catch (error: any) {
        logger.error('Authorization error:', error.message);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

/**
 * Middleware to check if user owns a resource
 */
export const requireOwnership = (resourceType: 'booking' | 'estate' | 'advisor') => {
    return async (req: any, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const resourceId = req.params.id;

            switch (resourceType) {
                case 'booking': {
                    const booking = await prisma.booking.findUnique({
                        where: { id: resourceId },
                        include: { advisor: true }
                    });

                    if (!booking) {
                        return res.status(404).json({ error: 'Booking not found' });
                    }

                    // Allow if user is the client or the advisor
                    if (booking.userId !== req.user.id && booking.advisor.userId !== req.user.id) {
                        return res.status(403).json({ error: 'Access denied' });
                    }
                    break;
                }

                case 'estate': {
                    const estate = await prisma.estate.findUnique({
                        where: { id: resourceId }
                    });

                    if (!estate) {
                        return res.status(404).json({ error: 'Estate not found' });
                    }

                    if (estate.userId !== req.user.id) {
                        return res.status(403).json({ error: 'Access denied' });
                    }
                    break;
                }

                case 'advisor': {
                    const advisor = await prisma.advisorProfile.findUnique({
                        where: { id: resourceId }
                    });

                    if (!advisor) {
                        return res.status(404).json({ error: 'Advisor not found' });
                    }

                    if (advisor.userId !== req.user.id) {
                        return res.status(403).json({ error: 'Access denied' });
                    }
                    break;
                }
            }

            next();
        } catch (error: any) {
            logger.error('Ownership check error:', error.message);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};
