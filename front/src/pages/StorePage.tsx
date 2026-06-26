import { Suspense, useMemo, useState } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { Bounds, Center, Environment, Float, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { DoubleSide, MeshBasicMaterial, TextureLoader } from 'three'

import bodyModelUrl from '../assets/models/hero/_body.glb?url'
import faceModelUrl from '../assets/models/clothes/_face_01.glb?url'
import hat01Url from '../assets/models/clothes/hat_01.glb?url'
import hat02Url from '../assets/models/clothes/hat_02.glb?url'
import hat03Url from '../assets/models/clothes/hat_03.glb?url'
import hatCrown01Url from '../assets/models/clothes/hat_crown_01.glb?url'
import hatCrown02Url from '../assets/models/clothes/hat_crown_02.glb?url'
import glasses01Url from '../assets/models/clothes/glasses_01.glb?url'
import glasses02Url from '../assets/models/clothes/glasses_02.glb?url'
import glasses03Url from '../assets/models/clothes/glasses_03.glb?url'
import paletteTextureUrl from '../assets/textures/t_pal.png?url'

const COIN_BALANCE = 350

const ITEMS = [
  { id: 'hat-01', category: 'Hats', name: 'Cone Cap', price: 100, model: hat01Url },
  { id: 'hat-02', category: 'Hats', name: 'Street Cap', price: 50, model: hat02Url },
  { id: 'hat-03', category: 'Hats', name: 'Blue Cap', price: 120, model: hat03Url },
  { id: 'hat-crown-01', category: 'Hats', name: 'Royal', price: 180, model: hatCrown01Url },
  { id: 'hat-crown-02', category: 'Hats', name: 'Royal', price: 180, model: hatCrown02Url },
  { id: 'glasses-01', category: 'Glasses', name: 'Tiny Shades', price: 100, model: glasses01Url },
  { id: 'glasses-02', category: 'Glasses', name: 'Classic Shades', price: 150, model: glasses02Url },
  { id: 'glasses-03', category: 'Glasses', name: 'Wide Shades', price: 170, model: glasses03Url },
]

const CATEGORY_SLOTS = [
  { label: 'hats', title: 'hats', available: 5 },
  { label: 'glasses', title: 'glasses', available: 3 },
  { label: 'masks', title: 'masks', available: 2 },
]

const categoryStyles = {
  hats: { borderColor: '#b8a08e', background: 'linear-gradient(180deg, #fffdf7, #f2e7dd)' },
  glasses: { borderColor: '#a3b8c8', background: 'linear-gradient(180deg, #fbfdff, #e6eef5)' },
  masks: { borderColor: '#c1b0c6', background: 'linear-gradient(180deg, #fffdfc, #f3e8f4)' },
}

function applyUnlitMaterial(scene, { preserveMap = true } = {}) {
  const next = scene.clone(true)

  next.traverse((child) => {
	if (!child.isMesh) return

	child.castShadow = false
	child.receiveShadow = false

	const sourceMaterial = Array.isArray(child.material) ? child.material[0] : child.material

	child.material = new MeshBasicMaterial({
	  map: preserveMap ? sourceMaterial?.map ?? null : null,
	  color: '#ffffff',
	  alphaMap: sourceMaterial?.alphaMap ?? null,
	  transparent: sourceMaterial?.transparent ?? false,
	  opacity: sourceMaterial?.opacity ?? 1,
	  side: DoubleSide,
	})
  })

  return next
}

function ItemPreview({ item, selected, rotation = [0, 0, 0], position = [0, 0, 0] }) {
  const { scene } = useGLTF(item.model)

  const model = useMemo(() => {
	const next = scene.clone(true)

	next.traverse((child) => {
	  if (!child.isMesh) return

	  child.castShadow = false
	  child.receiveShadow = false

	  const sourceMaterial = Array.isArray(child.material) ? child.material[0] : child.material

	  child.material = new MeshBasicMaterial({
		map: sourceMaterial?.map ?? null,
		color: '#ffffff',
		alphaMap: sourceMaterial?.alphaMap ?? null,
		transparent: sourceMaterial?.transparent ?? false,
		opacity: sourceMaterial?.opacity ?? 1,
		side: DoubleSide,
	  })
	})

	return next
  }, [scene, selected])

//   return <primitive object={model} scale={selected ? 1.15 : 1} position={[0, -0.85, 0]} rotation={[0, Math.PI * 0.1, 0]} />
  return <primitive object={model} scale={selected ? 1.15 : 1} position={position} rotation={rotation} />
}

function AvatarPreview({ item }) {
  const { scene: bodyScene } = useGLTF(bodyModelUrl)
  const { scene: faceScene } = useGLTF(faceModelUrl)

  const bodyModel = useMemo(() => applyUnlitMaterial(bodyScene), [bodyScene])
  const faceModel = useMemo(() => applyUnlitMaterial(faceScene), [faceScene])

  return (
	<group>
	  <Center>
		<group position={[0, -0.2, 0]} rotation={[0, Math.PI * 0.1, 0]}>
		  <primitive object={bodyModel} scale={1.15} />
		  <primitive object={faceModel} scale={1.15} />
		  <ItemPreview item={item} selected rotation={[0, 0, 0]} position={[0, 0, 0]} />
		</group>
	  </Center>
	</group>
  )
}

function StoreCard({ item, active, onSelect }) {
  const style = categoryStyles[item.category.toLowerCase()] ?? categoryStyles.hats

  return (
	<button
	  type='button'
	  onClick={onSelect}
	  style={{
		all: 'unset',
		cursor: 'pointer',
		display: 'grid',
		gap: 8,
		padding: 10,
		borderRadius: 18,
		border: active ? '2px solid var(--color-selected)' : `2px solid ${style.borderColor}`,
		background: active ? '#fff6e9' : style.background,
		boxShadow: active ? '0 16px 28px rgba(40, 25, 14, 0.14)' : '0 10px 20px rgba(32, 22, 15, 0.08)',
		minWidth: 116,
	  }}
	>
	  <div
		style={{
		  height: 128,
		  borderRadius: 12,
		  border: '1px solid rgba(52, 35, 22, 0.12)',
		  background: 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.35))',
		  display: 'grid',
		  placeItems: 'center',
		  overflow: 'hidden',
		}}
	  >
		<Suspense fallback={<span style={{ fontSize: 12, color: '#7c6a58' }}>Loading</span>}>
		  <Canvas shadows camera={{ position: [0, 0.35, 3.8], fov: 35 }}>
			{/* <ambientLight intensity={1.7} /> */}
			{/* <directionalLight position={[2, 2, 3]} intensity={2.2} castShadow /> */}
			<Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.35}>
			  <Bounds fit clip observe margin={1.2}>
				<Center>
				  <ItemPreview item={item} selected={active} rotation={[Math.PI * 0.02, Math.PI * 0.15, 0]} />
				</Center>
			  </Bounds>
			</Float>
		  </Canvas>
		</Suspense>
	  </div>
	  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
		<span style={{ fontWeight: 700, color: '#2f241e', fontSize: 14 }}>{item.name}</span>
		<span style={{ fontWeight: 800, color: '#5b4638', fontSize: 13 }}>{item.price}</span>
	  </div>
	  <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7b6558' }}>{item.category}</span>
	</button>
  )
}

const StorePage = () : JSX.Element => {
  const [selectedId, setSelectedId] = useState(ITEMS[1].id)

  const selectedItem = useMemo(() => ITEMS.find((item) => item.id === selectedId) ?? ITEMS[0], [selectedId])

  const groupedItems = useMemo(() => {
	return ITEMS.reduce((groups, item) => {
	  const key = item.category.toLowerCase()
	  groups[key] = groups[key] ?? []
	  groups[key].push(item)
	  return groups
	}, {})
  }, [])

  return (
	<main
	  style={{
		display: 'grid',
		gap: 20,
		minHeight: 'calc(100vh - 160px)',
		padding: '8px 0 0',
		color: '#3a2d27',
	  }}
	>
	  <header style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
		<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 14 }}>
		  <h1 style={{ margin: 0, fontSize: 'clamp(2.2rem, 5vw, 4rem)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 0.95 }}>
			Store
		  </h1>
		  <div
			style={{
			  display: 'inline-flex',
			  alignItems: 'center',
			  gap: 10,
			  padding: '10px 16px',
			  borderRadius: 999,
			  border: '2px solid rgba(58, 45, 39, 0.14)',
			  background: 'rgba(255, 251, 245, 0.82)',
			  boxShadow: '0 10px 24px rgba(60, 44, 32, 0.08)',
			  fontWeight: 800,
			}}
		  >
			<span style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: '50%', background: '#3a2d27', color: '#fff8ee', fontSize: 14 }}>
			  ◉
			</span>
			<span>{COIN_BALANCE}</span>
			<span style={{ fontWeight: 700, color: '#6b5a50' }}>(coin amount)</span>
		  </div>
		</div>
	  </header>

	  <section
		style={{
		  display: 'grid',
		  gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 0.95fr)',
		  gap: 18,
		  alignItems: 'stretch',
		  flex: 1,
		  height: 'min(700px, calc(100vh - 220px))',
		  maxHeight: 700,
		}}
	  >
		<article
		  style={{
			position: 'relative',
			overflowY: 'auto',
			overflowX: 'hidden',
			borderRadius: 28,
			border: '3px solid rgba(63, 47, 39, 0.35)',
			background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(250, 240, 228, 0.96))',
			boxShadow: '0 28px 60px rgba(54, 39, 30, 0.14)',
			minHeight: 0,
			height: '100%',
			padding: 20,
		  }}
		>
		  {/* <div
			style={{
			  position: 'absolute',
			  right: 14,
			  top: 14,
			  bottom: 14,
			  width: 12,
			  borderRadius: 999,
			  background: 'linear-gradient(180deg, #4e3f38 0%, #4e3f38 14%, #fff9f0 14%, #fff9f0 86%, #4e3f38 86%, #4e3f38 100%)',
			  opacity: 0.95,
			}}
		  /> */}

		  <div style={{ display: 'grid', gap: 28, paddingRight: 28 }}>
			{CATEGORY_SLOTS.map((slot) => {
			  const items = groupedItems[slot.label] ?? []

			  return (
				<section key={slot.label} style={{ display: 'grid', gap: 12 }}>
				  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'lowercase' }}>{slot.title}</h2>
				  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
					{items.map((item) => (
					  <StoreCard key={item.id} item={item} active={item.id === selectedItem.id} onSelect={() => setSelectedId(item.id)} />
					))}
				  </div>
				</section>
			  )
			})}
		  </div>
		</article>

		<aside
		  style={{
			borderRadius: 28,
			border: '3px solid rgba(63, 47, 39, 0.35)',
			background: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248, 239, 231, 0.98))',
			boxShadow: '0 28px 60px rgba(54, 39, 30, 0.14)',
			padding: 18,
			display: 'grid',
			gridTemplateRows: '1fr auto',
			gap: 16,
			minHeight: 0,
			height: '100%',
			overflow: 'hidden',
		  }}
		>
		  <div
			style={{
			  position: 'relative',
			  borderRadius: 24,
			  overflow: 'hidden',
			  border: '2px solid rgba(69, 52, 41, 0.18)',
			  background:
				'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.72), transparent 30%), linear-gradient(180deg, #fffdf8 0%, #f3e6d7 100%)',
			  minHeight: 0,
			  height: '100%',
			}}
		  >
			<Canvas shadows camera={{ position: [0, 0.3, 5.2], fov: 34 }}>
			  <color attach='background' args={['#2c1e52']} />
			  {/* <fog attach='fog' args={['#f9f1e7', 7, 16]} /> */}
			  {/* <ambientLight intensity={1.8} /> */}
			  {/* <directionalLight position={[2, 3, 4]} intensity={2.5} castShadow /> */}
			  {/* <directionalLight position={[-2, 1, 2]} intensity={1.2} /> */}
			  {/* <Environment preset='city' /> */}
			  <Suspense
				fallback={
				  <Html center>
					<div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
					  Loading 3D preview...
					</div>
				  </Html>
				}
			  >
				<Float speed={1} rotationIntensity={0.25} floatIntensity={0.5}>
				  <AvatarPreview item={selectedItem} />
				</Float>
				{/* <PreviewFloor /> */}
			  </Suspense>
			  <OrbitControls enablePan={false} minPolarAngle={1.1} maxPolarAngle={1.45} minDistance={4.4} maxDistance={6.5} />
			</Canvas>

			<div
			  style={{
				position: 'absolute',
				right: 18,
				bottom: 18,
				display: 'grid',
				justifyItems: 'end',
				gap: 10,
			  }}
			>
			  <button
				type='button'
				onClick={() => setSelectedId(selectedItem.id)}
				style={{
				  padding: '10px 16px',
				  borderRadius: 14,
				  border: '2px solid #46342b',
				  background: '#f7efe4',
				  color: '#2f231d',
				  fontWeight: 900,
				  letterSpacing: '0.08em',
				  textTransform: 'uppercase',
				  boxShadow: '0 10px 24px rgba(52, 36, 26, 0.15)',
				  cursor: 'pointer',
				}}
			  >
				Buy
			  </button>
			</div>
		  </div>

		  <div
			style={{
			  display: 'flex',
			  alignItems: 'center',
			  justifyContent: 'space-between',
			  gap: 14,
			  padding: '2px 2px 0',
			}}
		  >
			<div style={{ display: 'grid', gap: 2 }}>
			  <span style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8d745f', fontWeight: 800 }}>
				Selected item
			  </span>
			  <strong style={{ fontSize: 22, color: '#2f241e' }}>{selectedItem.name}</strong>
			  <span style={{ color: '#6f5b4d' }}>{selectedItem.category}</span>
			</div>
			<div
			  style={{
				minWidth: 108,
				padding: '14px 16px',
				borderRadius: 20,
				border: '2px solid rgba(70, 52, 43, 0.15)',
				background: '#fff7ee',
				textAlign: 'center',
				fontWeight: 900,
				color: '#3b2d25',
			  }}
			>
			  {selectedItem.price} coins
			</div>
		  </div>
		</aside>
	  </section>
	</main>
  )
}

useGLTF.preload(bodyModelUrl)
useGLTF.preload(faceModelUrl)
ITEMS.forEach((item) => useGLTF.preload(item.model))

export default StorePage
