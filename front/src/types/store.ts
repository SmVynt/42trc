export type StoreItem = {
  id: string
  category: string
  name: string
  price: number
  model: string
}

export type GroupedItems = Record<string, StoreItem[]>
