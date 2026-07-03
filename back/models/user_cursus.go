package models

import (
	"time"
)

// UserCursus is a user's progress in one cursus (belongs to User)
type UserCursus struct {
	ID           uint       `gorm:"primaryKey"`
	UserID       uint       `gorm:"not null;index;uniqueIndex:idx_user_cursus"`
	User         User       `gorm:"constraint:OnDelete:CASCADE"`
	CursusID     int        `gorm:"not null;uniqueIndex:idx_user_cursus"`
	CursusName   string     `gorm:"type:varchar(255)"`
	Level        float32
	Grade        string     `gorm:"type:varchar(50)"`
	BeginAt      *time.Time
	BlackholedAt *time.Time
}