package models

import (
	"time"
)

// UserProject is one project record for a user (belongs to User)
type UserProject struct {
	ID          uint       `gorm:"primaryKey"`
	UserID      uint       `gorm:"not null;index;uniqueIndex:idx_user_project"`
	User        User       `gorm:"constraint:OnDelete:CASCADE"`
	ProjectID   int        `gorm:"not null;uniqueIndex:idx_user_project"`
	Occurrence  int        `gorm:"uniqueIndex:idx_user_project"`
	ProjectName string     `gorm:"type:varchar(255)"`
	CursusID    *int
	FinalMark   *int
	Status      string     `gorm:"type:varchar(50)"`
	Validated   *bool
	MarkedAt    *time.Time
	Stars       int        `gorm:"not null;default:0"`
	IsExam      bool       `gorm:"not null;default:false"`
}