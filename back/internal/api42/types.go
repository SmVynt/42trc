package api42

import "time"

// --- Only the fields we actually use from the 42 API responses ---

type Image struct {
	Link string `json:"link"`
}

type Cursus struct {
	Name string `json:"name"`
}

type CursusUser struct {
	CursusID     int        `json:"cursus_id"`
	Level        float64    `json:"level"`
	Grade        string     `json:"grade"`
	BeginAt      *time.Time `json:"begin_at"`
	BlackholedAt *time.Time `json:"blackholed_at"`
	Cursus       Cursus     `json:"cursus"`
}

type Project struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type ProjectUser struct {
	Occurrence    int        `json:"occurrence"`
	FinalMark     *int       `json:"final_mark"`
	Status        string     `json:"status"`
	Validated     *bool      `json:"validated?"`
	CurrentTeamID *int       `json:"current_team_id"`
	Project       Project    `json:"project"`
	CursusIDs     []int      `json:"cursus_ids"`
	MarkedAt      *time.Time `json:"marked_at"`
}

type Profile struct {
	ID              int           `json:"id"`
	Login           string        `json:"login"`
	Email           string        `json:"email"`
	Displayname     string        `json:"displayname"`
	Wallet          int           `json:"wallet"`
	CorrectionPoint int           `json:"correction_point"`
	Image           Image         `json:"image"`
	CursusUsers     []CursusUser  `json:"cursus_users"`
	ProjectsUsers   []ProjectUser `json:"projects_users"`
}

// Team + scale_teams (for stars)
type Flag struct {
	ID int `json:"id"`
}

type ScaleTeam struct {
	Flag Flag `json:"flag"`
}

type Team struct {
	ScaleTeams []ScaleTeam `json:"scale_teams"`
}

// Full project (for the exam flag)
type ProjectDetail struct {
	Exam bool `json:"exam"`
}