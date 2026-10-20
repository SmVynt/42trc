package services

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/SmVynt/42trc/back/internal/api42"
	"github.com/SmVynt/42trc/back/models"
	"gorm.io/gorm"
)

const profileSyncInterval = time.Hour

// ProfileSyncer keeps the database limited to users who authenticated through
// the application, and refreshes their 42 profile and stars once per hour.
type ProfileSyncer struct {
	db     *gorm.DB
	jobs   chan string
	mutex  sync.Mutex
	queued map[string]bool
}

func NewProfileSyncer(db *gorm.DB) *ProfileSyncer {
	return &ProfileSyncer{
		db:     db,
		jobs:   make(chan string, 2048),
		queued: make(map[string]bool),
	}
}

// Start starts the login-triggered and hourly synchronization loop.
func (s *ProfileSyncer) Start(ctx context.Context) {
	go s.run(ctx)
}

// Enqueue schedules a profile refresh after a successful OAuth login. The
// request itself stays fast; the full profile and stars sync runs in the
// background and is also picked up by the hourly safety net.
func (s *ProfileSyncer) Enqueue(login string) {
	login = strings.ToLower(strings.TrimSpace(login))
	if login == "" {
		return
	}

	s.mutex.Lock()
	if s.queued[login] {
		s.mutex.Unlock()
		return
	}
	s.queued[login] = true
	s.mutex.Unlock()

	select {
	case s.jobs <- login:
	default:
		// The hourly query will retry this user. Do not block the OAuth request.
		s.clearQueued(login)
		log.Printf("profile sync queue is full; %s will be retried hourly", login)
	}
}

func (s *ProfileSyncer) run(ctx context.Context) {
	var client *api42.Client

	// Recover users that logged in before a restart or whose first sync failed.
	s.syncDue(ctx, &client)

	ticker := time.NewTicker(profileSyncInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case login := <-s.jobs:
			if !s.takeQueued(login) {
				continue
			}
			s.syncBatch(ctx, &client, []string{login})
		case <-ticker.C:
			s.syncDue(ctx, &client)
		}
	}
}

func (s *ProfileSyncer) syncDue(ctx context.Context, client **api42.Client) {
	cutoff := time.Now().Add(-profileSyncInterval)
	var users []models.User
	if err := s.db.Select("intra").Where(
		"last_login_at IS NOT NULL AND (last_api_sync_at IS NULL OR last_api_sync_at < ? OR api_sync_status IN ?)",
		cutoff, []string{"pending", "error"},
	).Find(&users).Error; err != nil {
		log.Printf("profile sync due-user query failed: %v", err)
		return
	}

	logins := make([]string, 0, len(users))
	for _, user := range users {
		login := strings.ToLower(strings.TrimSpace(user.Intra))
		if login != "" {
			logins = append(logins, login)
		}
	}
	if len(logins) == 0 {
		return
	}

	log.Printf("profile sync: %d due users", len(logins))
	for start := 0; start < len(logins); start += 50 {
		// OAuth-triggered jobs have priority over the hourly backlog.
		s.drainQueued(ctx, client)
		end := start + 50
		if end > len(logins) {
			end = len(logins)
		}
		s.syncBatch(ctx, client, logins[start:end])
		for _, login := range logins[start:end] {
			s.clearQueued(login)
		}
	}
}

func (s *ProfileSyncer) drainQueued(ctx context.Context, client **api42.Client) {
	for {
		select {
		case login := <-s.jobs:
			if s.takeQueued(login) {
				s.syncBatch(ctx, client, []string{login})
			}
		default:
			return
		}
	}
}

func (s *ProfileSyncer) syncBatch(ctx context.Context, client **api42.Client, logins []string) {
	if len(logins) == 0 {
		return
	}
	if err := s.setSyncState(logins, "syncing", ""); err != nil {
		log.Printf("profile sync status update failed: %v", err)
	}

	if *client == nil || (*client).Expired() {
		newClient, err := api42.NewClient(ctx)
		if err != nil {
			s.finishSync(logins, err)
			return
		}
		*client = newClient
	}

	if err := (*client).SeedLogins(ctx, s.db, logins, true); err != nil {
		s.finishSync(logins, err)
		return
	}
	if err := s.setSyncState(logins, "ok", ""); err != nil {
		log.Printf("profile sync success status update failed: %v", err)
	}
}

func (s *ProfileSyncer) finishSync(logins []string, syncErr error) {
	message := syncErr.Error()
	if len(message) > 1000 {
		message = message[:1000]
	}
	if err := s.setSyncState(logins, "error", message); err != nil {
		log.Printf("profile sync failure status update failed: %v", err)
	}
	log.Printf("profile sync failed for %d users: %v", len(logins), syncErr)
}

func (s *ProfileSyncer) setSyncState(logins []string, status, syncError string) error {
	normalized := make([]string, 0, len(logins))
	for _, login := range logins {
		normalized = append(normalized, strings.ToLower(strings.TrimSpace(login)))
	}
	values := map[string]interface{}{
		"api_sync_status": status,
		"api_sync_error":  syncError,
		"updated_at":      time.Now(),
	}
	if status == "ok" {
		values["last_api_sync_at"] = time.Now()
	}
	return s.db.Model(&models.User{}).Where("LOWER(intra) IN ?", normalized).Updates(values).Error
}

func (s *ProfileSyncer) clearQueued(login string) {
	s.mutex.Lock()
	delete(s.queued, login)
	s.mutex.Unlock()
}

func (s *ProfileSyncer) takeQueued(login string) bool {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	if !s.queued[login] {
		return false
	}
	delete(s.queued, login)
	return true
}
