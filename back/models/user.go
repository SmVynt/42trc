package models

import (
	"time"
)

// User is a 42 student profile plus in-app game stats
type User struct {
	ID              uint   `gorm:"primaryKey"`
	Username        string `gorm:"type:varchar(255);not null;uniqueIndex"`
	Intra           string `gorm:"type:varchar(255);index"`
	IntraID         *int   `gorm:"uniqueIndex"`
	Email           string `gorm:"type:varchar(255);uniqueIndex"`
	Displayname     string `gorm:"type:varchar(255)"`
	Image           string `gorm:"type:varchar(255)"`
	Wallet          int    `gorm:"default:0"`
	CorrectionPoint int    `gorm:"default:0"`
	PasswordHash    string `gorm:"type:varchar(255)"`
	EmailVerifiedAt *time.Time
	LastLoginAt     *time.Time `gorm:"index"`
	LastAPISyncAt   *time.Time `gorm:"index"`
	APISyncStatus   string     `gorm:"type:varchar(20);not null;default:'pending'"`
	APISyncError    string     `gorm:"type:text"`
	EquippedHat     string     `gorm:"type:varchar(255);default:''"`
	EquippedGlasses string     `gorm:"type:varchar(255);default:''"`
	EquippedFace    string     `gorm:"type:varchar(255);default:''"`
	OwnedItems      string     `gorm:"type:text;default:''"`
	GamesPlayed     int        `gorm:"not null;default:0"`
	Wins            int        `gorm:"not null;default:0"`
	Points          int        `gorm:"not null;default:0"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
