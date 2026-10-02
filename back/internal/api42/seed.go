package api42

import (
	"context"
	"fmt"
	"log"
	"sort"
	"sync"
	"time"

	"github.com/SmVynt/42trc/back/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SeedLogins upserts each login. If withStars is true, it also fetches
// stars (per team) and the exam flag (per project) — many extra API calls.
func (c *Client) SeedLogins(ctx context.Context, db *gorm.DB, logins []string, withStars bool) error {
	profiles := c.fetchProfiles(ctx, logins)
	log.Printf("profiles fetched: %d/%d", len(profiles), len(logins))
	if len(profiles) != len(logins) {
		return fmt.Errorf("only %d of %d profiles were fetched", len(profiles), len(logins))
	}
	starsByTeam := make(map[int]int)
	examByProject := make(map[int]bool)
	var metadataErr error
	if withStars {
		starsByTeam, examByProject, metadataErr = c.fetchProjectMetadata(ctx, db, profiles)
	}

	for _, profile := range profiles {
		login := profile.Login

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
		if err := db.Where("user_id = ? AND (cursus_id IS NULL OR cursus_id <> ?)", user.ID, coreCursusID).
			Delete(&models.UserProject{}).Error; err != nil {
			log.Printf("[%s] old non-core projects cleanup failed: %v", login, err)
		}

		if err := c.seedCursus(db, user.ID, profile.CursusUsers); err != nil {
			log.Printf("[%s] cursus failed: %v", login, err)
		}
		if err := c.seedProjects(db, user.ID, profile.ProjectsUsers, starsByTeam, examByProject, withStars); err != nil {
			log.Printf("[%s] projects failed: %v", login, err)
		}

		log.Printf("[%s] done: %d cursus, %d projects",
			login, len(profile.CursusUsers), len(profile.ProjectsUsers))
	}
	return metadataErr
}

func (c *Client) workerCount() int {
	if c.workers > 0 {
		return c.workers
	}
	return defaultAPIConcurrency
}

func (c *Client) fetchProfiles(ctx context.Context, logins []string) []*Profile {
	if len(logins) == 0 {
		return nil
	}

	profiles := make([]*Profile, len(logins))
	jobs := make(chan int)
	var wg sync.WaitGroup

	workers := c.workerCount()
	if workers > len(logins) {
		workers = len(logins)
	}
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for index := range jobs {
				login := logins[index]
				log.Printf("[%s] fetching profile...", login)
				profile, err := c.FetchUser(ctx, login)
				if err != nil {
					log.Printf("[%s] skip: %v", login, err)
					continue
				}
				rawProjects := len(profile.ProjectsUsers)
				profile.ProjectsUsers = coreProjects(profile.ProjectsUsers)
				profiles[index] = profile
				log.Printf("[%s] profile ok: %d cursus, %d core projects (%d total)",
					login, len(profile.CursusUsers), len(profile.ProjectsUsers), rawProjects)
			}
		}()
	}

	for i := range logins {
		jobs <- i
	}
	close(jobs)
	wg.Wait()

	result := make([]*Profile, 0, len(logins))
	for _, profile := range profiles {
		if profile != nil {
			result = append(result, profile)
		}
	}
	return result
}

const coreCursusID = 21

func coreProjects(projects []ProjectUser) []ProjectUser {
	filtered := make([]ProjectUser, 0, len(projects))
	for _, project := range projects {
		for _, cursusID := range project.CursusIDs {
			if cursusID == coreCursusID {
				filtered = append(filtered, project)
				break
			}
		}
	}
	return filtered
}

type metadataBatch struct {
	kind string
	ids  []int
}

type metadataBatchResult struct {
	kind        string
	starsByTeam map[int]int
	examByID    map[int]bool
	err         error
}

func (c *Client) fetchProjectMetadata(ctx context.Context, db *gorm.DB, profiles []*Profile) (map[int]int, map[int]bool, error) {
	const teamBatchSize = 50
	const projectBatchSize = 100

	teamIDs := make(map[int]struct{})
	projectIDs := make(map[int]struct{})
	for _, profile := range profiles {
		for _, pu := range profile.ProjectsUsers {
			if pu.Project.ID > 0 {
				projectIDs[pu.Project.ID] = struct{}{}
			}
			if pu.CurrentTeamID != nil && pu.Validated != nil && *pu.Validated {
				teamIDs[*pu.CurrentTeamID] = struct{}{}
			}
		}
	}

	teamIDList := sortedIDs(teamIDs)
	projectIDList := sortedIDs(projectIDs)

	// Team stars change during the day, so keep them for one hour. Project
	// exam flags are effectively static and can be cached longer.
	starsByTeam, staleTeams := loadTeamMetadata(db, teamIDList, time.Hour)
	examByProject, staleProjects := loadProjectMetadata(db, projectIDList, 24*time.Hour)

	batches := make([]metadataBatch, 0)
	for _, ids := range chunkIDs(staleTeams, teamBatchSize) {
		batches = append(batches, metadataBatch{kind: "team", ids: ids})
	}
	for _, ids := range chunkIDs(staleProjects, projectBatchSize) {
		batches = append(batches, metadataBatch{kind: "project", ids: ids})
	}
	log.Printf("metadata: %d teams (%d stale), %d projects (%d stale)",
		len(teamIDList), len(staleTeams), len(projectIDList), len(staleProjects))

	if len(batches) == 0 {
		return starsByTeam, examByProject, nil
	}

	jobs := make(chan metadataBatch)
	results := make(chan metadataBatchResult)
	var wg sync.WaitGroup
	workers := c.workerCount()
	if workers > len(batches) {
		workers = len(batches)
	}
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobs {
				if job.kind == "team" {
					values, err := c.CountStarsBatch(ctx, job.ids)
					results <- metadataBatchResult{kind: job.kind, starsByTeam: values, err: err}
					continue
				}
				values, err := c.IsExamBatch(ctx, job.ids)
				results <- metadataBatchResult{kind: job.kind, examByID: values, err: err}
			}
		}()
	}

	go func() {
		for _, batch := range batches {
			jobs <- batch
		}
		close(jobs)
		wg.Wait()
		close(results)
	}()

	completed := 0
	failed := 0
	for result := range results {
		completed++
		if result.err != nil {
			failed++
			log.Printf("metadata %s batch failed: %v", result.kind, result.err)
			continue
		}
		if result.kind == "team" {
			for id, stars := range result.starsByTeam {
				starsByTeam[id] = stars
			}
			if err := saveTeamMetadata(db, result.starsByTeam); err != nil {
				log.Printf("team metadata cache save failed: %v", err)
			}
		} else {
			for id, exam := range result.examByID {
				examByProject[id] = exam
			}
			if err := saveProjectMetadata(db, result.examByID); err != nil {
				log.Printf("project metadata cache save failed: %v", err)
			}
		}
		log.Printf("metadata progress: %d/%d batches", completed, len(batches))
	}
	if failed > 0 {
		return starsByTeam, examByProject, fmt.Errorf("%d of %d metadata batches failed", failed, len(batches))
	}
	return starsByTeam, examByProject, nil
}

func loadTeamMetadata(db *gorm.DB, ids []int, ttl time.Duration) (map[int]int, []int) {
	values := make(map[int]int, len(ids))
	if len(ids) == 0 {
		return values, nil
	}
	var rows []models.TeamMetadata
	if err := db.Where("team_id IN ?", ids).Find(&rows).Error; err != nil {
		log.Printf("team metadata cache read failed: %v", err)
	}
	cutoff := time.Now().Add(-ttl)
	fresh := make(map[int]bool, len(rows))
	for _, row := range rows {
		values[row.TeamID] = row.Stars
		if !row.SyncedAt.Before(cutoff) {
			fresh[row.TeamID] = true
		}
	}
	stale := make([]int, 0, len(ids))
	for _, id := range ids {
		if !fresh[id] {
			stale = append(stale, id)
		}
	}
	return values, stale
}

func loadProjectMetadata(db *gorm.DB, ids []int, ttl time.Duration) (map[int]bool, []int) {
	values := make(map[int]bool, len(ids))
	if len(ids) == 0 {
		return values, nil
	}
	var rows []models.ProjectMetadata
	if err := db.Where("project_id IN ?", ids).Find(&rows).Error; err != nil {
		log.Printf("project metadata cache read failed: %v", err)
	}
	cutoff := time.Now().Add(-ttl)
	fresh := make(map[int]bool, len(rows))
	for _, row := range rows {
		values[row.ProjectID] = row.IsExam
		if !row.SyncedAt.Before(cutoff) {
			fresh[row.ProjectID] = true
		}
	}
	stale := make([]int, 0, len(ids))
	for _, id := range ids {
		if !fresh[id] {
			stale = append(stale, id)
		}
	}
	return values, stale
}

func saveTeamMetadata(db *gorm.DB, values map[int]int) error {
	if len(values) == 0 {
		return nil
	}
	now := time.Now()
	rows := make([]models.TeamMetadata, 0, len(values))
	for id, stars := range values {
		rows = append(rows, models.TeamMetadata{TeamID: id, Stars: stars, SyncedAt: now})
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "team_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"stars", "synced_at"}),
	}).CreateInBatches(&rows, 100).Error
}

func saveProjectMetadata(db *gorm.DB, values map[int]bool) error {
	if len(values) == 0 {
		return nil
	}
	now := time.Now()
	rows := make([]models.ProjectMetadata, 0, len(values))
	for id, isExam := range values {
		rows = append(rows, models.ProjectMetadata{ProjectID: id, IsExam: isExam, SyncedAt: now})
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "project_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"is_exam", "synced_at"}),
	}).CreateInBatches(&rows, 100).Error
}

func sortedIDs(values map[int]struct{}) []int {
	ids := make([]int, 0, len(values))
	for id := range values {
		ids = append(ids, id)
	}
	sort.Ints(ids)
	return ids
}

func chunkIDs(ids []int, size int) [][]int {
	chunks := make([][]int, 0, (len(ids)+size-1)/size)
	for start := 0; start < len(ids); start += size {
		end := start + size
		if end > len(ids) {
			end = len(ids)
		}
		chunks = append(chunks, ids[start:end])
	}
	return chunks
}

func (c *Client) seedCursus(db *gorm.DB, userID uint, cursus []CursusUser) error {
	rows := make([]models.UserCursus, 0, len(cursus))
	for _, cu := range cursus {
		rows = append(rows, cursusToModel(userID, cu))
	}
	if len(rows) == 0 {
		return nil
	}
	return db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}, {Name: "cursus_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"cursus_name", "level", "grade", "begin_at", "blackholed_at",
		}),
	}).CreateInBatches(&rows, 100).Error
}

func (c *Client) seedProjects(db *gorm.DB, userID uint, projects []ProjectUser, starsByTeam map[int]int, examByProject map[int]bool, withStars bool) error {
	rows := make([]models.UserProject, 0, len(projects))
	for _, pu := range projects {
		stars := 0
		exam := false

		if withStars {
			if pu.CurrentTeamID != nil && pu.Validated != nil && *pu.Validated {
				stars = starsByTeam[*pu.CurrentTeamID]
			}
			exam = examByProject[pu.Project.ID]
		}

		rows = append(rows, projectToModel(userID, pu, stars, exam))
	}
	if len(rows) == 0 {
		return nil
	}

	assign := []string{
		"project_name", "cursus_id", "final_mark", "status",
		"validated", "marked_at",
	}
	if withStars {
		assign = append(assign, "stars", "is_exam")
	}

	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "project_id"}, {Name: "occurrence"}},
		DoUpdates: clause.AssignmentColumns(assign),
	}).CreateInBatches(&rows, 100).Error
}

var _ = models.User{}
