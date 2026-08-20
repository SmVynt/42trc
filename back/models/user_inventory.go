package models

import "time"

type UserInventory struct {
	ID         uint   `gorm:"primaryKey"`
	UserID     uint   `gorm:"not null;index"`
	User       User   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	ItemID     string `gorm:"type:varchar(255);not null;index"`
	Item       Item   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Quantity   int    `gorm:"not null;default:1"`
	IsEquipped bool   `gorm:"default:false"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
