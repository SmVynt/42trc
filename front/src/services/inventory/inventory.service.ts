import { http } from '../../api/http'
import type { InventoryItem, InventoryTab } from '../../types/inventory'
import type { User } from '../../types/user'

type RawInventoryItem = Record<string, any>

const normalizeInventoryItem = (raw: RawInventoryItem): InventoryItem => {
  const item = raw.item ?? raw.Item ?? {}

  return {
    id: raw.id ?? raw.ID,
    itemId: raw.itemId ?? raw.ItemID ?? item.id ?? item.ID,
    quantity: raw.quantity ?? raw.Quantity ?? 1,
    isEquipped: raw.isEquipped ?? raw.IsEquipped ?? false,
    item: {
      id: item.id ?? item.ID,
      name: item.name ?? item.Name ?? 'Unknown item',
      category: item.category ?? item.Category ?? 'Misc',
      price: item.price ?? item.Price ?? 0,
      description: item.description ?? item.Description,
      image: item.image ?? item.Image,
      rarity: item.rarity ?? item.Rarity,
    },
  }
}

export const inventoryService = {
  async getItems(token: string, tab: InventoryTab): Promise<InventoryItem[]> {
    const response = await http<{ inventory: RawInventoryItem[] }>(`/api/v1/inventory?tab=${tab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return (response.inventory ?? []).map(normalizeInventoryItem)
  },

  async equipItem(token: string, itemId: string, category: string): Promise<{ user: User; message: string }> {
    return http<{ user: User; message: string }>('/api/users/me/equip-item', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemId, category }),
    })
  },
}
