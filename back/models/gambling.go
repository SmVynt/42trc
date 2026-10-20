package models

import "time"

type GamblingLog struct {
	ID        uint   `gorm:"primaryKey;autoIncrement"`
	UserID    uint   `gorm:"column:user_id;index;not null"`
	GameType  string `gorm:"type:varchar(50);not null"`
	BetAmount int    `gorm:"column:bet_amount;not null"`
	WinAmount int    `gorm:"column:win_amount;not null"`
	// Result contains the outcome. Slot rounds store a compact JSON payload here;
	// simple games such as coin flip store a plain string.
	Result    string    `gorm:"type:text"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"-"`
}
