require('dotenv').config();
const { pool } = require('../models/db');

const FORTY_TWO_API_BASE = 'https://api.intra.42.fr';
const OUTSTANDING_FLAG_ID = 9;

const LOGINS = ['nmikuka', 'psmolin', 'vpushkar', 'omizin', 'icorrale'];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Cache exam flag per project_id so we fetch each project only once
const examCache = new Map();

const getAppToken = async () => {
	const res = await fetch(`${FORTY_TWO_API_BASE}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: process.env.OAUTH_42_CLIENT_ID,
			client_secret: process.env.OAUTH_42_CLIENT_SECRET,
		}),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error_description || data.error || 'token request failed');
	return data.access_token;
};

// GET with 429 retry and a small throttle
const apiGet = async (token, path) => {
	const res = await fetch(`${FORTY_TWO_API_BASE}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (res.status === 429) {
		await sleep(1000);
		return apiGet(token, path);
	}
	if (!res.ok) {
		console.error(`  GET ${path} -> HTTP ${res.status}`);
		return null;
	}
	await sleep(300);
	return res.json();
};

const upsertUser = async (p) => {
	const username = (p.login || '').trim().toLowerCase();
	const email = (p.email || '').trim().toLowerCase() || null;
	const intra = p.login || username;
	const image = p.image?.link || null;
	const res = await pool.query(
		`INSERT INTO users
			(username, email, intra, intra_id, displayname, image, wallet, correction_point, email_verified_at, last_login_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
		ON CONFLICT (email) DO UPDATE
		SET username = EXCLUDED.username,
			intra = EXCLUDED.intra,
			intra_id = EXCLUDED.intra_id,
			displayname = EXCLUDED.displayname,
			image = EXCLUDED.image,
			wallet = EXCLUDED.wallet,
			correction_point = EXCLUDED.correction_point,
			updated_at = now()
		RETURNING id`,
		[username, email, intra, p.id, p.displayname, image, p.wallet, p.correction_point]
	);
	return res.rows[0].id;
};

const seedCursus = async (userId, cursusUsers = []) => {
	for (const c of cursusUsers) {
		await pool.query(
			`INSERT INTO user_cursus
				(user_id, cursus_id, cursus_name, level, grade, begin_at, blackholed_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (user_id, cursus_id) DO UPDATE
			SET cursus_name = EXCLUDED.cursus_name,
				level = EXCLUDED.level,
				grade = EXCLUDED.grade,
				begin_at = EXCLUDED.begin_at,
				blackholed_at = EXCLUDED.blackholed_at`,
			[userId, c.cursus_id, c.cursus?.name || null, c.level, c.grade, c.begin_at, c.blackholed_at]
		);
	}
};

// Count scale_teams flagged "Outstanding project" for one team
const countStars = async (token, teamId) => {
	if (!teamId) return 0;
	const team = await apiGet(token, `/v2/teams/${teamId}`);
	if (!team || !Array.isArray(team.scale_teams)) return 0;
	return team.scale_teams.filter(st => st.flag?.id === OUTSTANDING_FLAG_ID).length;
};

// Resolve project.exam flag, cached per project_id
const isExam = async (token, projectId) => {
	if (projectId == null) return false;
	if (examCache.has(projectId)) return examCache.get(projectId);
	const project = await apiGet(token, `/v2/projects/${projectId}`);
	const flag = project?.exam === true;
	examCache.set(projectId, flag);
	return flag;
};

const seedProjects = async (token, userId, projectsUsers = []) => {
	for (const pr of projectsUsers) {
		const projectId = pr.project?.id;
		const stars = await countStars(token, pr.current_team_id);
		const exam = await isExam(token, projectId);
		await pool.query(
			`INSERT INTO user_projects
				(user_id, project_id, project_name, cursus_id, final_mark, status, validated, marked_at, occurrence, stars, is_exam)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			ON CONFLICT (user_id, project_id, occurrence) DO UPDATE
			SET project_name = EXCLUDED.project_name,
				cursus_id = EXCLUDED.cursus_id,
				final_mark = EXCLUDED.final_mark,
				status = EXCLUDED.status,
				validated = EXCLUDED.validated,
				marked_at = EXCLUDED.marked_at,
				stars = EXCLUDED.stars,
				is_exam = EXCLUDED.is_exam`,
			[
				userId,
				projectId,
				pr.project?.name || null,
				pr.cursus_ids?.[0] ?? null,
				pr.final_mark,
				pr.status,
				pr['validated?'] ?? null,
				pr.marked_at,
				pr.occurrence ?? 0,
				stars,
				exam,
			]
		);
	}
};

const run = async () => {
	try {
		console.log('Requesting app token...');
		const token = await getAppToken();
		for (const login of LOGINS) {
			console.log(`Fetching ${login}...`);
			const profile = await apiGet(token, `/v2/users/${login}`);
			if (!profile) continue;
			const userId = await upsertUser(profile);
			await seedCursus(userId, profile.cursus_users);
			await seedProjects(token, userId, profile.projects_users);
			console.log(`  seeded ${profile.login}: ${profile.projects_users?.length || 0} rows`);
		}
		console.log('Done.');
	} catch (err) {
		console.error('Seed failed:', err.message);
		process.exitCode = 1;
	} finally {
		await pool.end();
	}
};

run();