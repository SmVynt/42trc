package api42

import (
	"context"
	"log"

	"github.com/SmVynt/42trc/back/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SeedLogins upserts each login. If withStars is true, it also fetches
// stars (per team) and the exam flag (per project) — many extra API calls.
func (c *Client) SeedLogins(ctx context.Context, db *gorm.DB, logins []string, withStars bool) error {
	examCache := make(map[int]bool)

	for _, login := range logins {
		log.Printf("[%s] fetching profile...", login)
		profile, err := c.FetchUser(ctx, login)
		if err != nil {
			log.Printf("[%s] skip: %v", login, err)
			continue
		}
		log.Printf("[%s] profile ok: %d cursus, %d projects",
			login, len(profile.CursusUsers), len(profile.ProjectsUsers))

		user := profileToUser(profile)
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "email"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"username", "intra", "intra_id", "displayname",
				"image", "wallet", "correction_point", "updated_at",
			}),
		}).Create(&user).Error; err != nil {
			log.Printf("[%s] user upsert failed: %v", login, err)
			continue
		}

		if err := c.seedCursus(db, user.ID, profile.CursusUsers); err != nil {
			log.Printf("[%s] cursus failed: %v", login, err)
		}
		if err := c.seedProjects(ctx, db, user.ID, profile.ProjectsUsers, examCache, withStars); err != nil {
			log.Printf("[%s] projects failed: %v", login, err)
		}

		log.Printf("[%s] done: %d cursus, %d projects",
			login, len(profile.CursusUsers), len(profile.ProjectsUsers))
	}
	return nil
}

func (c *Client) seedCursus(db *gorm.DB, userID uint, cursus []CursusUser) error {
	for _, cu := range cursus {
		row := cursusToModel(userID, cu)
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "user_id"}, {Name: "cursus_id"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"cursus_name", "level", "grade", "begin_at", "blackholed_at",
			}),
		}).Create(&row).Error; err != nil {
			return err
		}
	}
	return nil
}

func (c *Client) seedProjects(ctx context.Context, db *gorm.DB, userID uint, projects []ProjectUser, examCache map[int]bool, withStars bool) error {
	for _, pu := range projects {
		stars := 0
		exam := false

		// Heavy part: only when explicitly requested
		if withStars {
			if pu.CurrentTeamID != nil && pu.Validated != nil && *pu.Validated {
				if s, err := c.CountStars(ctx, *pu.CurrentTeamID); err == nil {
					stars = s
				}
			}
			e, ok := examCache[pu.Project.ID]
			if !ok {
				if v, err := c.IsExam(ctx, pu.Project.ID); err == nil {
					e = v
				}
				examCache[pu.Project.ID] = e
			}
			exam = e
		}

		row := projectToModel(userID, pu, stars, exam)
		assign := []string{
			"project_name", "cursus_id", "final_mark", "status",
			"validated", "marked_at",
		}
		// Don't overwrite existing stars/is_exam during a fast (no-stars) run
		if withStars {
			assign = append(assign, "stars", "is_exam")
		}

		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "project_id"}, {Name: "occurrence"}},
			DoUpdates: clause.AssignmentColumns(assign),
		}).Create(&row).Error; err != nil {
			return err
		}
	}
	return nil
}

var _ = models.User{}