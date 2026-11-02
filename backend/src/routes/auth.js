const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');

const env = require('../config/env');
const asyncHandler = require('../middleware/asyncHandler');
const APIError = require('../utils/ApiError');
const { generateToken, cookieOptions } = require('../utils/jwt');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const User = require('../models/user');
const PasswordResetToken = require('../models/passwordResetToken');
const emailService = require('../services/emailService');
const settings = require('../models/setting');

const router = express.Router();

const registerSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(80),
    email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
    password: z.string().trim().min(8, 'Password must be at least 8 characters long').max(128),
    companyName: z.string().trim().min(1, 'Company name is required').max(255),
    address: z.string().trim().max(255).optional(),
   
});

 const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
    password: z.string().trim().min(8, 'Password must be at least 8 characters long').max(128),
});

const profileSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(80),

}); 

const passwordSchema = z.object({
    currentPassword: z.string().trim().min(8, 'Current password must be at least 8 characters long').max(128),
    newPassword: z.string().trim().min(8, 'New password must be at least 8 characters long').max(128),
});

const forgotPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
});

const resetPasswordSchema = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid or expired reset link'),
    password: z.string().trim().min(8, 'Password must be at least 8 characters long').max(128),
});

function issueSession(res, user) {
    const token = generateToken({
        sub: user.id,
        sv: user.session_version ?? 0,
    });
    res.cookie(env.cookieName, token, cookieOptions);
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    };
}


router.post(
    '/register',
    authLimiter,
    validate(registerSchema),
    asyncHandler(async (req, res) => {
        const { name, email, password, companyName, address } = req.body;

        const existing = await User.findByEmail(email);

        if (existing) {
            throw APIError.conflict('Email already exists');
        }

        const passwordHash = await User.hashPassword(password);

        const user = await User.create({
            name,
            email,
            passwordHash,
            companyName,
            address
        });

        await settings.ensure(user.id);

        if (companyName || address) {
            await settings.update(user.id, {
                company_name: companyName || "",
                address: address || "",
                email
            });
        }

        issueSession(res, user);

        res.status(201).json({ user: publicUser(user) });
    })
);

router.post(
    '/login',
    authLimiter,
    validate(loginSchema),
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const record = await User.findByEmail(email);
        if (!record) throw APIError.unauthorized('Invalid email or password');

        const ok = await User.comparePassword(password, record.password_hash);
        if (!ok) throw APIError.unauthorized('Invalid email or password');

        const user = publicUser(record);
        issueSession(res, record);

        res.json({ user });
    }
));

router.post(
    '/forgot-password',
    authLimiter,
    validate(forgotPasswordSchema),
    asyncHandler(async (req, res) => {
        emailService.assertEmailConfigured();

        const record = await User.findByEmail(req.body.email);
        if (record) {
            const token = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

            await PasswordResetToken.replaceForUser(record.id, tokenHash, expiresAt);
            try {
                await emailService.sendPasswordResetEmail(record.email, token);
            } catch (error) {
                await PasswordResetToken.deleteByHash(tokenHash);
                console.error('Password reset email delivery failed', error);
            }
        }

        res.json({
            message: 'If an account exists for that email, a password reset link will be sent shortly.',
        });
    })
);

router.post(
    '/reset-password',
    authLimiter,
    validate(resetPasswordSchema),
    asyncHandler(async (req, res) => {
        const tokenHash = crypto.createHash('sha256').update(req.body.token).digest('hex');
        const passwordHash = await User.hashPassword(req.body.password);
        const updated = await PasswordResetToken.consumeAndUpdatePassword(
            tokenHash,
            passwordHash
        );

        if (!updated) {
            throw APIError.badRequest('This password reset link is invalid or has expired.');
        }

        res.clearCookie(env.cookieName, cookieOptions);
        res.json({ message: 'Password updated successfully. Please sign in.' });
    })
);

 router.post(
    '/logout', (req, res) => {
        res.clearCookie(env.cookieName, cookieOptions);
        res.json({ message: 'Logged out successfully' });
    }
);

router.get(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
        res.json({ user: req.user });
    })
);

router.patch(
    '/profile',
    authLimiter,
    requireAuth,
    validate(profileSchema),
    asyncHandler(async (req, res) => {
        const user = await User.updateName(req.user.id, req.body.name);
        if (!user) throw APIError.notFound('User not found');

        res.json({ user: publicUser(user) });
    })
);

router.patch(
    '/password',
    authLimiter,
    requireAuth,
    validate(passwordSchema),
    asyncHandler(async (req, res) => {
        const record = await User.findByIdWithPassword(req.user.id);
        if (!record) throw APIError.notFound('User not found');

        const ok = await User.comparePassword(req.body.currentPassword, record.password_hash);
        if (!ok) throw APIError.unauthorized('Current password is incorrect');

        const passwordHash = await User.hashPassword(req.body.newPassword);
        await User.updatePassword(req.user.id, passwordHash);

        res.json({ message: 'Password updated successfully' });
    }
));

module.exports = router;
