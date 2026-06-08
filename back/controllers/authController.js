const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { isAllowedSchoolEmail, allowedSchoolEmailDomains } = require('../utils/emailPolicy');

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
                    username: payload.email.split('@')[0],
                    email: payload.email,
                },
                $set: {
                    emailVerifiedAt: new Date(),
                    lastLoginAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            message: 'Email confirmed.',
            verified: true,
            user,
        });
    } catch (error) {
        console.error('Login confirmation failed', error);
        return res.status(401).json({
            message: 'The confirmation link is invalid or expired.',
            verified: false,
        });
    }
};

module.exports = {
    requestLogin,
    confirmLogin,
};
