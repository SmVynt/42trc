package models

import (
	"time"

	"gorm.io/datatypes"
)

type Item struct {
	ID          string         `gorm:"type:varchar(255);primaryKey"`
	Name        string         `gorm:"type:varchar(255);not null;index"`
	Category    string         `gorm:"type:varchar(100);default:'misc';index"`
	IsSellable  bool           `gorm:"not null;default:false"`
	Price       int            `gorm:"not null;default:100"`
	Description string         `gorm:"type:text"`
	Image       string         `gorm:"type:varchar(255)"`
	Rarity      string         `gorm:"type:varchar(50);default:'common'"`
	Attributes  datatypes.JSON `gorm:"type:jsonb"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
