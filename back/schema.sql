-- Full schema, safe to run on an empty database

CREATE TABLE items (
	id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name        TEXT NOT NULL,
	type        TEXT NOT NULL DEFAULT 'misc',
	description TEXT,
	image       TEXT,
	rarity      TEXT NOT NULL DEFAULT 'common',
	attributes  JSONB,
	created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_name ON items (name);

CREATE TABLE users (
	id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	username          TEXT NOT NULL UNIQUE,
	intra             TEXT,
	intra_id          BIGINT UNIQUE,
	email             TEXT UNIQUE,
	displayname       TEXT,
	image             TEXT,
	wallet            INTEGER,
	correction_point  INTEGER,
	email_verified_at TIMESTAMPTZ,
	last_login_at     TIMESTAMPTZ,
	password_hash     TEXT,
	games_played      INTEGER NOT NULL DEFAULT 0,
	wins              INTEGER NOT NULL DEFAULT 0,
	points            INTEGER NOT NULL DEFAULT 0,
	created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_items (
	id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name        TEXT NOT NULL,
	type        TEXT NOT NULL DEFAULT 'misc',
	description TEXT,
	image       TEXT,
	quantity    INTEGER NOT NULL DEFAULT 1,
	metadata    JSONB
);

CREATE INDEX idx_inventory_items_user_id ON inventory_items (user_id);

-- Cursus progress
CREATE TABLE user_cursus (
	id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	cursus_id     INTEGER NOT NULL,
	cursus_name   TEXT,
	level         REAL,
	grade         TEXT,
	begin_at      TIMESTAMPTZ,
	blackholed_at TIMESTAMPTZ,
	UNIQUE (user_id, cursus_id)
);

CREATE INDEX idx_user_cursus_user_id ON user_cursus (user_id);

-- User projects
-- cursus_id = which cursus the project belongs to (21 = 42cursus, 9 = C Piscine)
-- stars     = scale_teams flagged "Outstanding project" (flag id 9)
-- is_exam   = project.exam flag from /v2/projects/:id
CREATE TABLE user_projects (
	id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	project_id    INTEGER NOT NULL,
	project_name  TEXT,
	cursus_id     INTEGER,
	final_mark    INTEGER,
	status        TEXT,
	validated     BOOLEAN,
	marked_at     TIMESTAMPTZ,
	occurrence    INTEGER,
	stars         INTEGER NOT NULL DEFAULT 0,
	is_exam       BOOLEAN NOT NULL DEFAULT false,
	UNIQUE (user_id, project_id, occurrence)
);

CREATE INDEX idx_user_projects_user_id ON user_projects (user_id);