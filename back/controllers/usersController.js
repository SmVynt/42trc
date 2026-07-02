const { query } = require('../models/db');

const CORE_CURSUS_ID = 21; // 42cursus (main course)

// Counts only main-course (cursus 21) validated projects/exams; DISTINCT so retries count once
const getLevels = async (req, res) => {
	try {
		const result = await query(
			`SELECT u.username, u.displayname, c.level,
				COUNT(DISTINCT p.project_id) FILTER (
					WHERE p.is_exam = false AND p.validated = true AND p.cursus_id = $1
				) AS projects,
				COUNT(DISTINCT p.project_id) FILTER (
					WHERE p.is_exam = true AND p.validated = true AND p.cursus_id = $1
				) AS exams,
				COALESCE(SUM(p.stars) FILTER (WHERE p.cursus_id = $1), 0) AS stars
			FROM users u
			LEFT JOIN user_cursus c
				ON c.user_id = u.id AND c.grade ILIKE 'cadet'
			LEFT JOIN user_projects p
				ON p.user_id = u.id
			GROUP BY u.id, u.username, u.displayname, c.level
			ORDER BY c.level DESC NULLS LAST, u.username ASC`,
			[CORE_CURSUS_ID]
		);
		return res.status(200).json({ users: result.rows });
	} catch (error) {
		console.error('getLevels failed', error);
		return res.status(500).json({ message: 'Failed to load levels.' });
	}
};

module.exports = { getLevels };