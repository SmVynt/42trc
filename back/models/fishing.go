package models

import "time"

// Rod — a fishing rod. Its fields feed directly into the minigame:
// they set the green-zone size and how the bar handles.
type Rod struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	Name      string  `gorm:"not null" json:"name"`
	BarHeight float64 `gorm:"not null" json:"barHeight"` // green zone, % of track
	Control   float64 `gorm:"not null" json:"control"`   // bar responsiveness (lift vs gravity)
	CatchRate float64 `gorm:"not null" json:"catchRate"` // progress gain per second in zone
}

func (Rod) TableName() string { return "rods" }

// Fish — a catchable fish. Higher speed = darts faster = harder to keep in the zone.
// Rarity is a weight for random selection (higher = more common).
type Fish struct {
	ID         uint    `gorm:"primaryKey" json:"id"`
	Name       string  `gorm:"not null" json:"name"`
	Speed      float64 `gorm:"not null" json:"speed"`                   // 0..1, higher = faster
	EscapeRate float64 `gorm:"not null;default:0.45" json:"escapeRate"` // progress lost/sec when out of zone
	Rarity     int     `gorm:"not null;default:1" json:"rarity"`
}

type FishCatch struct {
	ID       uint      `gorm:"primaryKey" json:"id"`
	UserID   uint      `gorm:"index;not null" json:"userId"`
	FishID   uint      `gorm:"index;not null" json:"fishId"`
	Weight   float64   `gorm:"not null" json:"weight"`
	CaughtAt time.Time `gorm:"autoCreateTime;index" json:"caughtAt"`
}

func (Fish) TableName() string { return "fish" }
