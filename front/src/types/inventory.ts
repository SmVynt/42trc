export type InventoryCatalogItem = {
  id: string
  name: string
  category: string
  price: number
  description?: string
  image?: string
  rarity?: string
}

export type InventoryItem = {
  id: number
  itemId: string
  quantity: number
  isEquipped: boolean
  item: InventoryCatalogItem
}

export type InventoryTab = 'cosmetics' | 'sellable'
