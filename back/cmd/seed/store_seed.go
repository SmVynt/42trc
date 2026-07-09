package seed

import (
	"log"
	"transcendence-back/models"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func	InitializeStoreItems(db *gorm.DB) {
	initialItems := []models.Item{
		{ID: "hat-01", Category: "Hats", Name: "Cone Cap", Price: 100, Image: "/assets/models/clothes/hat_01.glb", Attributes: datatypes.JSON([]byte("{}"))},
		{ID: "hat-02", Category: "Hats", Name: "Street Cap", Price: 50, Image: "/assets/models/clothes/hat_02.glb", Attributes: datatypes.JSON([]byte("{}"))},
		{ID: "hat-03", Category: "Hats", Name: "Blue Cap", Price: 120, Image: "/assets/models/clothes/hat_03.glb", Attributes: datatypes.JSON([]byte("{}"))},
		{ID: "hat-04", Category: "Hats", Name: "Royal", Price: 180, Image: "/assets/models/clothes/hat_crown_01.glb", Attributes: datatypes.JSON([]byte("{}"))},
		{ID: "hat-05", Category: "Hats", Name: "Royal", Price: 180, Image: "/assets/models/clothes/hat_crown_02.glb", Attributes: datatypes.JSON([]byte("{}"))},
		{ID: "glasses-01", Category: "Glasses", Name: "Tiny Shades", Price: 100, Image: "/assets/models/clothes/glasses_01.glb", Attributes: datatypes.JSON([]byte("{}"))},
		{ID: "glasses-02", Category: "Glasses", Name: "Classic Shades", Price: 150, Image: "/assets/models/clothes/glasses_02.glb", Attributes: datatypes.JSON([]byte("{}"))},
		{ID: "glasses-03", Category: "Glasses", Name: "Wide Shades", Price: 170, Image: "/assets/models/clothes/glasses_03.glb", Attributes: datatypes.JSON([]byte("{}"))},
	}

	log.Println("Initializing database with initial items")
	for _, item := range initialItems {
		err := db.Where(models.Item{ID: item.ID}).FirstOrCreate(&item).Error
		if err != nil {
			log.Printf("Error adding item %s: %v", item.ID, err)
		}
	}
	log.Println("DB has been successfully seeded")
}