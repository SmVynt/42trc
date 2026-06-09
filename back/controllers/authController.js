const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAllowedSchoolEmail, allowedSchoolEmailDomains } = require('../utils/emailPolicy');

const FORTY_TWO_API_BASE = 'https://api.intra.42.fr';

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
	console.log('Received 42 OAuth callback with body:', req.body);
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
		console.log('-- Exchanging code for token with 42 API...');
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

		console.log('-- Token response status:', tokenResponse.status);
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
			accessToken: tokenData.access_token,
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
	getMe,
	handle42OAuthCallback,
};
