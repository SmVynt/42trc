package services

import (
	"errors"
	"fmt"

	"github.com/SmVynt/42trc/back/models"
	"github.com/SmVynt/42trc/back/stores"
	"gorm.io/gorm"
)

var (
	ErrInventoryNotFound    = errors.New("inventory item not found")
	ErrInventoryForbidden   = errors.New("you do not own this inventory item")
	ErrItemNotSellable      = errors.New("item is not sellable")
	ErrInsufficientQuantity = errors.New("insufficient quantity")
	ErrInvalidSellQuantity  = errors.New("quantity must be greater than zero")
)

type InventoryService struct {
	db    *gorm.DB
	store *stores.InventoryStore
}

type SellResult struct {
	Wallet           int
	RemainingAmount  int
	InventoryRemoved bool
	Item             models.Item
	QuantitySold     int
}

func NewInventoryService(db *gorm.DB) *InventoryService {
	return &InventoryService{db: db, store: stores.NewInventoryStore()}
}

func (s *InventoryService) List(userID uint, tab string) ([]models.UserInventory, error) {
	var inventory []models.UserInventory
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		items, err := s.store.ListByTab(tx, userID, tab)
		if err != nil {
			return err
		}
		inventory = items
		return nil
	}); err != nil {
		return nil, err
	}

	return inventory, nil
}

func (s *InventoryService) Sell(userID uint, inventoryID uint, quantity int) (*SellResult, error) {
	if quantity <= 0 {
		return nil, ErrInvalidSellQuantity
	}

	result := &SellResult{QuantitySold: quantity}
	err := s.db.Transaction(func(tx *gorm.DB) error {
		inventory, err := s.store.GetByIDForUpdate(tx, inventoryID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInventoryNotFound
			}
			return err
		}

		if inventory.UserID != userID {
			return ErrInventoryForbidden
		}

		if !inventory.Item.IsSellable {
			return ErrItemNotSellable
		}

		if inventory.Quantity < quantity {
			return ErrInsufficientQuantity
		}

		result.Item = inventory.Item
		price := inventory.Item.Price * quantity

		if inventory.Quantity == quantity {
			if err := s.store.Delete(tx, inventory.ID); err != nil {
				return err
			}
			result.InventoryRemoved = true
			result.RemainingAmount = 0
		} else {
			if err := s.store.DecreaseQuantity(tx, inventory.ID, quantity); err != nil {
				return err
			}
			result.RemainingAmount = inventory.Quantity - quantity
		}

		if err := s.store.IncreaseWallet(tx, userID, price); err != nil {
			return err
		}

		updatedUser, err := s.store.GetUserByID(tx, userID)
		if err != nil {
			return err
		}
		result.Wallet = updatedUser.Wallet
		return nil
	})

	if err != nil {
		return nil, err
	}

	return result, nil
}

func (r SellResult) Message() string {
	if r.InventoryRemoved {
		return fmt.Sprintf("Sold %d item(s) and removed the inventory row.", r.QuantitySold)
	}
	return fmt.Sprintf("Sold %d item(s).", r.QuantitySold)
}
