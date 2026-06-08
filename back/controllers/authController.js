const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { isAllowedSchoolEmail, allowedSchoolEmailDomains } = require('../utils/emailPolicy');

const FORTY_TWO_API_BASE = 'https://api.intra.42.fr';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildMailer = () => {
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (hasSmtpConfig) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || 'false') === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    return nodemailer.createTransport({ jsonTransport: true });
};

const requestLogin = async (req, res) => {
    const { email } = req.body;

    if (!email || !emailPattern.test(email)) {
        return res.status(400).json({
            message: 'A valid email address is required.',
        });
    }

    if (!isAllowedSchoolEmail(email)) {
        return res.status(403).json({
            message: 'Only approved school emails can access this project.',
            allowedSchoolEmailDomains,
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
        const isPreviewTransport = !hasSmtpConfig;
        const token = jwt.sign(
            { email: normalizedEmail, purpose: 'email-login' },
            process.env.JWT_SK,
            { expiresIn: '15m' }
        );

        const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`;
        const transporter = buildMailer();
        const sender = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@42trc.local';

        const mailResult = await transporter.sendMail({
            from: sender,
            to: normalizedEmail,
            subject: 'Confirm your 42trc login',
            text: [
                'You requested a login link for 42trc.',
                '',
                `Open this link to confirm your email: ${confirmationUrl}`,
                '',
                'If you did not request this login, you can ignore this email.',
            ].join('\n'),
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
                    <h2 style="margin: 0 0 12px;">Confirm your 42trc login</h2>
                    <p style="margin: 0 0 16px;">Open the button below to confirm your email and continue.</p>
                    <p style="margin: 0 0 20px;">
                        <a href="${confirmationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#111827;color:#fff;text-decoration:none;">Confirm email</a>
                    </p>
                    <p style="margin: 0; word-break: break-word;">${confirmationUrl}</p>
                </div>
            `,
        });

        return res.status(200).json({
            message: 'Confirmation email prepared.',
            email: normalizedEmail,
            confirmationUrl: process.env.NODE_ENV !== 'production' || isPreviewTransport ? confirmationUrl : undefined,
            deliveryMode: isPreviewTransport ? 'preview' : 'smtp',
            preview: mailResult.preview,
        });
    } catch (error) {
        console.error('Failed to send login confirmation', error);
        return res.status(500).json({
            message: 'Could not send the confirmation email.',
        });
    }
};

const confirmLogin = async (req, res) => {
    const token = req.query.token || req.body.token;

    if (!token) {
        return res.status(400).json({ message: 'Token is required.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SK);

        if (payload.purpose !== 'email-login' || !isAllowedSchoolEmail(payload.email)) {
            return res.status(403).json({ message: 'Invalid login token.' });
        }

        const user = await User.findOneAndUpdate(
            { email: payload.email },
            {
                $setOnInsert: {
                    // username should be the full email address per requirements
                    username: payload.email,
                    email: payload.email,
                },
                $set: {
                    emailVerifiedAt: new Date(),
                    lastLoginAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        // create a session token for the frontend to use
        const sessionToken = jwt.sign(
            { email: payload.email, purpose: 'session' },
            process.env.JWT_SK,
            { expiresIn: process.env.SESSION_EXPIRES_IN || '7d' }
        );

        return res.status(200).json({
            message: 'Email confirmed.',
            verified: true,
            user,
            token: sessionToken,
        });
    } catch (error) {
        console.error('Login confirmation failed', error);
        return res.status(401).json({
            message: 'The confirmation link is invalid or expired.',
            verified: false,
        });
    }
};

const getMe = async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = (authHeader.startsWith('Bearer ') && authHeader.slice(7)) || req.query.token || req.body.token;

        if (!token) return res.status(401).json({ message: 'Missing auth token.' });

        const payload = jwt.verify(token, process.env.JWT_SK);
        if (payload.purpose !== 'session' || !payload.email) {
            return res.status(401).json({ message: 'Invalid session token.' });
        }

        const user = await User.findOne({ email: payload.email }).lean();
        if (!user) return res.status(404).json({ message: 'User not found.' });

        return res.status(200).json({ user });
    } catch (error) {
        console.error('getMe failed', error);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

const handle42OAuthCallback = async (req, res) => {
    const { code, state } = req.body;
    const clientId = process.env.OAUTH_42_CLIENT_ID;
    const clientSecret = process.env.OAUTH_42_CLIENT_SECRET;
    const redirectUri = process.env.OAUTH_42_REDIRECT_URI || process.env.FRONTEND_URL || 'http://localhost:5173/login';

    if (!clientId || !clientSecret) {
        return res.status(500).json({ message: '42 OAuth is not configured on this server.' });
    }

    if (!code) {
        return res.status(400).json({ message: 'Authorization code is required.' });
    }

    try {
        const tokenResponse = await fetch(`${FORTY_TWO_API_BASE}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
                ...(state ? { state } : {}),
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error(tokenData?.error_description || tokenData?.error || 'Could not exchange the authorization code.');
        }

        const profileResponse = await fetch(`${FORTY_TWO_API_BASE}/v2/me`, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const profile = await profileResponse.json();

        if (!profileResponse.ok) {
            throw new Error(profile?.message || 'Could not fetch the 42 user profile.');
        }

        const email = (profile.email || '').trim().toLowerCase();
        if (!email || !isAllowedSchoolEmail(email)) {
            return res.status(403).json({
                message: 'Only approved school emails can access this project.',
                allowedSchoolEmailDomains,
            });
        }

        const username = (profile.login || email).trim().toLowerCase();
        const user = await User.findOneAndUpdate(
            { email },
            {
                $setOnInsert: {
                    username,
                    intra: profile.login || username,
                    email,
                },
                $set: {
                    emailVerifiedAt: new Date(),
                    lastLoginAt: new Date(),
                    intra: profile.login || username,
                },
            },
            { upsert: true, new: true }
        );

        const sessionToken = jwt.sign(
            { email, purpose: 'session' },
            process.env.JWT_SK,
            { expiresIn: process.env.SESSION_EXPIRES_IN || '7d' }
        );

        return res.status(200).json({
            message: '42 OAuth login complete.',
            user,
            token: sessionToken,
            profile,
        });
    } catch (error) {
        console.error('42 OAuth callback failed', error);
        return res.status(401).json({
            message: error.message || 'The 42 authorization flow failed.',
        });
    }
};

module.exports = {
    requestLogin,
    confirmLogin,
    getMe,
    handle42OAuthCallback,
};
