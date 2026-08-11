package stores

import (
	"errors"
	"strings"

	"github.com/SmVynt/42trc/back/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrInvalidInventoryTab = errors.New("invalid inventory tab")

type InventoryStore struct{}

func NewInventoryStore() *InventoryStore {
	return &InventoryStore{}
}

func (s *InventoryStore) ListByTab(tx *gorm.DB, userID uint, tab string) ([]models.UserInventory, error) {
	var inventory []models.UserInventory
	query := tx.Model(&models.UserInventory{}).
		Preload("Item").
		Joins("JOIN items ON items.id = user_inventories.item_id").
		Where("user_inventories.user_id = ?", userID)

	switch strings.ToLower(strings.TrimSpace(tab)) {
	case "cosmetics":
		query = query.Where("(LOWER(items.category) = ? OR LOWER(items.category) IN (?, ?))", "cosmetic", "hats", "glasses")
	case "sellable":
		query = query.Where("items.is_sellable = ?", true)
	default:
		return nil, ErrInvalidInventoryTab
	}

	if err := query.Find(&inventory).Error; err != nil {
		return nil, err
	}

	return inventory, nil
}

func (s *InventoryStore) GetByIDForUpdate(tx *gorm.DB, inventoryID uint) (*models.UserInventory, error) {
	var inventory models.UserInventory
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Item").First(&inventory, inventoryID).Error; err != nil {
		return nil, err
	}

	return &inventory, nil
}

func (s *InventoryStore) DecreaseQuantity(tx *gorm.DB, inventoryID uint, quantity int) error {
	return tx.Model(&models.UserInventory{}).
		Where("id = ?", inventoryID).
		Update("quantity", gorm.Expr("quantity - ?", quantity)).Error
}

func (s *InventoryStore) Delete(tx *gorm.DB, inventoryID uint) error {
	return tx.Delete(&models.UserInventory{}, inventoryID).Error
}

func (s *InventoryStore) IncreaseWallet(tx *gorm.DB, userID uint, amount int) error {
	return tx.Model(&models.User{}).
		Where("id = ?", userID).
		Update("wallet", gorm.Expr("wallet + ?", amount)).Error
}

func (s *InventoryStore) GetUserByID(tx *gorm.DB, userID uint) (*models.User, error) {
	var user models.User
	if err := tx.First(&user, userID).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
