import type { StoreItem } from '../../types/store'

type Props = {
  item: StoreItem
  active: boolean
  onSelect: () => void
}

export const StoreCard = ({ item, active, onSelect }: Props) => {
  return (
    <button type="button" onClick={onSelect}>
      {item.name}
    </button>
  )
}
