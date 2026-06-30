package models

import (
	"time"

	"gorm.io/datatypes"
)

type Item struct {
	ID          uint           `gorm:"primaryKey"`
	Name        string         `gorm:"type:varchar(255);not null;index"`
	Type        string         `gorm:"type:varchar(100);default:'misc'"`
	Description string         `gorm:"type:text"`
	Image       string         `gorm:"type:varchar(255)"`
	Rarity      string         `gorm:"type:varchar(50);default:'common'"`
	Attributes  datatypes.JSON `gorm:"type:jsonb"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}