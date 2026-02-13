import rateLimit from 'express-rate-limit';
import { logger } from '../lib/logger.js';
/**
 * Rate limiter for booking creation
 * Prevents spam bookings
 */
export const bookingCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 bookings per 15 minutes
    message: 'Too many booking requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for booking creation: ${req.ip}`);
        res.status(429).json({
            error: 'Too many booking requests. Please try again in 15 minutes.'
        });
    }
});
/**
 * Rate limiter for payment intents
 * Prevents payment spam
 */
export const paymentIntentLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 payment intents per 10 minutes
    message: 'Too many payment requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for payment intent: ${req.ip}`);
        res.status(429).json({
            error: 'Too many payment requests. Please try again in 10 minutes.'
        });
    }
});
/**
 * Rate limiter for advisor profile updates
 * Prevents profile spam
 */
export const profileUpdateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 updates per hour
    message: 'Too many profile updates. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for profile update: ${req.ip}`);
        res.status(429).json({
            error: 'Too many profile updates. Please try again in 1 hour.'
        });
    }
});
/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for auth: ${req.ip}`);
        res.status(429).json({
            error: 'Too many authentication attempts. Please try again in 15 minutes.'
        });
    }
});
/**
 * General API rate limiter
 * Prevents API abuse
 */
export const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for general API: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests. Please try again in 15 minutes.'
        });
    }
});
