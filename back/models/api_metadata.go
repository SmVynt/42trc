package models

import "time"

// TeamMetadata caches the expensive team stars lookup from the 42 API.
type TeamMetadata struct {
	TeamID   int       `gorm:"primaryKey"`
	Stars    int       `gorm:"not null;default:0"`
	SyncedAt time.Time `gorm:"index;not null"`
}

// ProjectMetadata caches the project exam flag from the 42 API.
type ProjectMetadata struct {
	ProjectID int       `gorm:"primaryKey"`
	IsExam    bool      `gorm:"not null;default:false"`
	SyncedAt  time.Time `gorm:"index;not null"`
}
