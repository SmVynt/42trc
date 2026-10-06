import { useEffect, useMemo, useState } from 'react'
import { inventoryActive } from './fishing/FishingState'
import { authService } from '../../services/auth/auth.service'
import { useAuth } from '../../hooks/useAuth'
import { inventoryService } from '../../services/inventory/inventory.service'
import { tokenService } from '../../storage/token.service'
import type { InventoryItem, InventoryTab } from '../../types/inventory'

const KNOWN_COSMETICS = [
	{ id: 'hat-01', name: 'Cone Cap', category: 'Hats', price: 100 },
	{ id: 'hat-02', name: 'Street Cap', category: 'Hats', price: 50 },
	{ id: 'hat-03', name: 'Blue Cap', category: 'Hats', price: 120 },
	{ id: 'hat-crown-01', name: 'Royal Crown', category: 'Hats', price: 180 },
	{ id: 'hat-crown-02', name: 'Royal Crown', category: 'Hats', price: 180 },
	{ id: 'glasses-01', name: 'Tiny Shades', category: 'Glasses', price: 100 },
	{ id: 'glasses-02', name: 'Classic Shades', category: 'Glasses', price: 150 },
	{ id: 'glasses-03', name: 'Wide Shades', category: 'Glasses', price: 170 },
]

const EQUIPMENT_SLOTS = [
	{ label: 'Hat', category: 'Hats', field: 'equippedHat' as const },
	{ label: 'Glasses', category: 'Glasses', field: 'equippedGlasses' as const },
	{ label: 'Face', category: 'Face', field: 'equippedFace' as const },
]

type Rod = {
	id: number
	name: string
	barHeight: number
	control: number
	catchRate: number
}

type InventoryView = InventoryTab | 'rods'

type InventoryOverlayProps = {
	onClose: () => void
	equippedRodId?: number | null
	onEquip?: (id: number) => void
}

const fallbackItems = (ownedItems: string): InventoryItem[] => {
	const ownedIds = ownedItems.split(',').map((id) => id.trim()).filter(Boolean)

	return ownedIds.flatMap((itemId, index) => {
		const catalogItem = KNOWN_COSMETICS.find((item) => item.id === itemId)
		if (!catalogItem) return []

		return [{
			id: -(index + 1),
			itemId,
			quantity: 1,
			isEquipped: false,
			item: catalogItem,
		}]
	})
}

const mergeInventoryItems = (items: InventoryItem[], ownedItems: string) => {
	const byItemId = new Map(items.map((item) => [item.itemId, item]))

	for (const fallbackItem of fallbackItems(ownedItems)) {
		if (!byItemId.has(fallbackItem.itemId)) {
			byItemId.set(fallbackItem.itemId, fallbackItem)
		}
	}

	return Array.from(byItemId.values())
}

const InventoryOverlay = ({ onClose, equippedRodId = null, onEquip }: InventoryOverlayProps) => {
	const { user, updateUser } = useAuth()
	const [tab, setTab] = useState<InventoryView>('cosmetics')
	const [items, setItems] = useState<InventoryItem[]>([])
	const [rods, setRods] = useState<Rod[]>([])
	const [loading, setLoading] = useState(true)
	const [equipping, setEquipping] = useState<string | null>(null)
	const [message, setMessage] = useState('')

	const token = tokenService.get()

	useEffect(() => {
		inventoryActive.current = true
		return () => { inventoryActive.current = false }
	}, [])

	useEffect(() => {
		let active = true

		const loadInventory = async () => {
			if (!token) {
				setLoading(false)
				setMessage('Auth session not found.')
				return
			}

			setLoading(true)
			setMessage('')

			try {
				if (tab === 'rods') {
					const response = await fetch('/api/fishing/rods')
					if (!response.ok) throw new Error('Failed to load rods.')
					const rodList: Rod[] = await response.json()
					if (active) setRods(rodList)
					return
				}

				const inventory = await inventoryService.getItems(token, tab)
				if (active) {
					setItems(tab === 'cosmetics' ? mergeInventoryItems(inventory, user?.ownedItems ?? '') : inventory)
				}
			} catch (error: any) {
				if (active) {
					const localItems = tab === 'cosmetics' ? fallbackItems(user?.ownedItems ?? '') : []
					setItems(localItems)
					setMessage(user ? '' : (error?.message || 'Failed to load inventory.'))
				}
			} finally {
				if (active) setLoading(false)
			}
		}

		loadInventory()
		return () => {
			active = false
		}
	}, [tab, token, user?.ownedItems])

	const equippedItems = useMemo(() => {
		return EQUIPMENT_SLOTS.map((slot) => ({
			slot,
			item: items.find((item) => item.itemId === user?.[slot.field]),
			knownItem: KNOWN_COSMETICS.find((item) => item.id === user?.[slot.field]),
			itemId: user?.[slot.field] || '',
		}))
	}, [items, user])

	const equip = async (item: InventoryItem) => {
		if (!token) {
			setMessage('Auth session not found.')
			return
		}

		setEquipping(item.itemId)
		setMessage('Saving equipment...')

		try {
			const response = await inventoryService.equipItem(token, item.itemId, item.item.category)
			updateUser(response.user)
			setMessage(`${item.item.name} equipped.`)
		} catch (error: any) {
			setMessage(error?.message || 'Failed to equip item.')
		} finally {
			setEquipping(null)
		}
	}

	const removeEquipment = async (slot: typeof EQUIPMENT_SLOTS[number]) => {
		if (!token) {
			setMessage('Auth session not found.')
			return
		}

		setEquipping(slot.field)
		setMessage('Saving equipment...')

		try {
			const response = await inventoryService.equipItem(token, '', slot.category)
			updateUser(response.user)
			setMessage(`${slot.label} removed.`)
		} catch (error: any) {
			setMessage(error?.message || 'Failed to remove item.')
		} finally {
			setEquipping(null)
		}
	}

	const equipRod = async (rodId: number) => {
		if (!token) {
			setMessage('Auth session not found.')
			return
		}

		setEquipping(String(rodId))
		setMessage('Saving equipment...')
		try {
			const response = await authService.equipRod(token, rodId)
			updateUser(response.user)
			onEquip?.(rodId)
			setMessage('Rod equipped.')
		} catch (error: any) {
			setMessage(error?.message || 'Failed to equip rod.')
		} finally {
			setEquipping(null)
		}
	}

	return (
		<div
			role='dialog'
			aria-modal='true'
			aria-label='In-game inventory'
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 20,
				display: 'grid',
				placeItems: 'center',
				padding: 24,
				background: 'rgba(2, 6, 23, 0.72)',
				backdropFilter: 'blur(8px)',
				overflowY: 'auto',
			}}
		>
			<div
				style={{
					width: 'min(900px, 100%)',
					maxHeight: 'calc(100vh - 48px)',
					overflowY: 'auto',
					padding: 24,
					borderRadius: 28,
					border: '3px solid rgba(255, 255, 255, 0.22)',
					background: 'linear-gradient(180deg, #f7eee3 0%, #ead8c8 100%)',
					boxShadow: '0 30px 90px rgba(0, 0, 0, 0.4)',
					color: '#3a2d27',
				}}
			>
				<header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
					<div>
						<div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8d745f', fontWeight: 800 }}>WebFishing</div>
						<h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Inventory</h1>
					</div>
					<button type='button' onClick={onClose} style={{ marginLeft: 'auto', padding: '10px 14px', borderRadius: 12, border: '2px solid rgba(58, 45, 39, 0.18)', background: '#fff7ee', color: '#3a2d27', fontWeight: 900, cursor: 'pointer' }}>
						Close <span aria-hidden='true'>×</span>
					</button>
				</header>

				<section style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
					<h2 style={{ margin: 0, fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Equipment</h2>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
						{equippedItems.map(({ slot, item, knownItem, itemId }) => (
							<div key={slot.field} style={{ minHeight: 108, padding: 14, borderRadius: 16, border: '2px solid #b8a08e', background: 'rgba(255, 253, 247, 0.78)', display: 'grid', alignContent: 'space-between', gap: 8 }}>
								<span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8d745f', fontWeight: 800 }}>{slot.label}</span>
								<strong style={{ fontSize: 16 }}>{item?.item.name ?? knownItem?.name ?? (itemId || 'Empty')}</strong>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
									<span style={{ fontSize: 12, color: '#6f5b4d' }}>{item ? 'Equipped' : 'Nothing equipped'}</span>
									{itemId && (
										<button type='button' onClick={() => removeEquipment(slot)} disabled={equipping !== null} style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #b91c1c', background: '#fff1f2', color: '#b91c1c', fontSize: 11, fontWeight: 800, cursor: equipping !== null ? 'not-allowed' : 'pointer' }}>
											{equipping === slot.field ? 'Saving...' : 'Remove'}
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				</section>

			<nav aria-label='Inventory categories' style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
				{(['cosmetics', 'sellable', 'rods'] as InventoryView[]).map((tabName) => (
					<button key={tabName} type='button' onClick={() => setTab(tabName)} style={{ padding: '9px 14px', borderRadius: 999, border: tab === tabName ? '2px solid #3a2d27' : '2px solid rgba(58, 45, 39, 0.18)', background: tab === tabName ? '#3a2d27' : '#fff7ee', color: tab === tabName ? '#fff8ee' : '#3a2d27', fontWeight: 800, textTransform: 'capitalize', cursor: 'pointer' }}>
						{tabName}
					</button>
				))}
			</nav>

			{message && <p role='status' style={{ margin: '0 0 12px', color: message.includes('equipped') || message.includes('removed') ? '#047857' : '#b91c1c', fontWeight: 700 }}>{message}</p>}
			{loading ? (
				<p>Loading inventory...</p>
			) : tab === 'rods' ? rods.length === 0 ? (
				<p style={{ padding: 24, borderRadius: 16, background: 'rgba(255, 253, 247, 0.72)' }}>No rods available.</p>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
					{rods.map((rod) => {
						const equipped = rod.id === equippedRodId || rod.id === user?.equippedRodId
						return (
							<article key={rod.id} style={{ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: equipped ? '2px solid #059669' : '2px solid rgba(63, 47, 39, 0.18)', background: equipped ? '#f0fdf4' : '#fffaf3' }}>
								<strong>{rod.name}</strong>
								<span style={{ fontSize: 12, color: '#8d745f' }}>Zone {rod.barHeight} · control {rod.control}</span>
								<button type='button' onClick={() => equipRod(rod.id)} disabled={equipped || equipping !== null} style={{ padding: '8px 10px', borderRadius: 10, border: equipped ? '1px solid #86efac' : '1px solid #3a2d27', background: equipped ? '#dcfce7' : '#3a2d27', color: equipped ? '#047857' : '#fff8ee', fontWeight: 800, cursor: equipped || equipping !== null ? 'not-allowed' : 'pointer' }}>
									{equipping === String(rod.id) ? 'Saving...' : equipped ? 'Equipped' : 'Equip'}
								</button>
							</article>
						)
					})}
				</div>
			) : items.length === 0 ? (
				<p style={{ padding: 24, borderRadius: 16, background: 'rgba(255, 253, 247, 0.72)' }}>No items in this category yet.</p>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
					{items.map((item) => {
						const alreadyEquipped = EQUIPMENT_SLOTS.some((slot) => user?.[slot.field] === item.itemId)
						return (
							<article key={item.id} style={{ display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: alreadyEquipped ? '2px solid #059669' : '2px solid rgba(63, 47, 39, 0.18)', background: alreadyEquipped ? '#f0fdf4' : '#fffaf3' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
									<strong>{item.item.name}</strong>
									<span style={{ color: '#6f5b4d', fontSize: 12 }}>×{item.quantity}</span>
								</div>
								<span style={{ fontSize: 12, color: '#8d745f' }}>{item.item.category}</span>
								{tab === 'cosmetics' && (
									<button type='button' onClick={() => equip(item)} disabled={alreadyEquipped || equipping !== null} style={{ padding: '8px 10px', borderRadius: 10, border: alreadyEquipped ? '1px solid #86efac' : '1px solid #3a2d27', background: alreadyEquipped ? '#dcfce7' : '#3a2d27', color: alreadyEquipped ? '#047857' : '#fff8ee', fontWeight: 800, cursor: alreadyEquipped || equipping !== null ? 'not-allowed' : 'pointer' }}>
										{equipping === item.itemId ? 'Saving...' : alreadyEquipped ? 'Equipped' : 'Equip'}
									</button>
								)}
							</article>
						)
					})}
				</div>
			)}
			</div>
		</div>
	)
}

export default InventoryOverlay
