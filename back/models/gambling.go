package models

import "time"

type GamblingLog struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"`
	UserID    uint      `gorm:"column:user_id;index;not null"`
	GameType  string    `gorm:"type:varchar(50);not null"`
	BetAmount int64     `gorm:"column:bet_amount;not null"`
	WinAmount int64     `gorm:"column:win_amount;not null"`
	Result    string    `gorm:"type:varchar(100)"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"-"`
}