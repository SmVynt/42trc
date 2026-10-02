import StorePage from '../../pages/StorePage'

type StoreOverlayProps = {
	onClose: () => void
}

const StoreOverlay = ({ onClose }: StoreOverlayProps) => {
	return (
		<div
			role='dialog'
			aria-modal='true'
			aria-label='In-game store'
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
					width: 'min(1240px, 100%)',
					maxHeight: 'calc(100vh - 48px)',
					overflowY: 'auto',
					padding: 24,
					borderRadius: 28,
					border: '3px solid rgba(255, 255, 255, 0.22)',
					background: 'linear-gradient(180deg, #f7eee3 0%, #ead8c8 100%)',
					boxShadow: '0 30px 90px rgba(0, 0, 0, 0.4)',
				}}
			>
				<StorePage embedded onClose={onClose} />
			</div>
		</div>
	)
}

export default StoreOverlay
