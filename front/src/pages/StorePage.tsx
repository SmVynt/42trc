import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { DoubleSide, MeshBasicMaterial } from 'three'
import { StoreCard } from '../components/store/StoreCard'

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

const COIN_BALANCE = 350

type StoreItem = {
  id: string
  category: string
  name: string
  price: number
  model: string
}

type CategorySlot = {
  label: string
  title: string
  available: number
}

type GroupedItems = Record<string, StoreItem[]>

const ITEMS: StoreItem[] = [
  { id: 'hat-01', category: 'Hats', name: 'Cone Cap', price: 100, model: hat01Url },
  { id: 'hat-02', category: 'Hats', name: 'Street Cap', price: 50, model: hat02Url },
  { id: 'hat-03', category: 'Hats', name: 'Blue Cap', price: 120, model: hat03Url },
  { id: 'hat-crown-01', category: 'Hats', name: 'Royal', price: 180, model: hatCrown01Url },
  { id: 'hat-crown-02', category: 'Hats', name: 'Royal', price: 180, model: hatCrown02Url },
  { id: 'glasses-01', category: 'Glasses', name: 'Tiny Shades', price: 100, model: glasses01Url },
  { id: 'glasses-02', category: 'Glasses', name: 'Classic Shades', price: 150, model: glasses02Url },
  { id: 'glasses-03', category: 'Glasses', name: 'Wide Shades', price: 170, model: glasses03Url },
]

const CATEGORY_SLOTS: CategorySlot[] = [
  { label: 'hats', title: 'hats', available: 5 },
  { label: 'glasses', title: 'glasses', available: 3 },
  { label: 'masks', title: 'masks', available: 2 },
]

/* -----------------------------
   3D helpers
------------------------------ */

function applyUnlitMaterial(scene: any) {
  const cloned = scene.clone(true)

  cloned.traverse((child: any) => {
    if (!child.isMesh) return

    const source = Array.isArray(child.material)
      ? child.material[0]
      : child.material

    child.material = new MeshBasicMaterial({
      map: source?.map ?? null,
      alphaMap: source?.alphaMap ?? null,
      transparent: source?.transparent ?? false,
      opacity: source?.opacity ?? 1,
      side: DoubleSide,
    })
  })

  return cloned
}

function AvatarPreview() {
  const { scene: bodyScene } = useGLTF(bodyModelUrl)
  const { scene: faceScene } = useGLTF(faceModelUrl)

  const body = useMemo(() => applyUnlitMaterial(bodyScene), [bodyScene])
  const face = useMemo(() => applyUnlitMaterial(faceScene), [faceScene])

  return (
    <group>
      <primitive object={body} scale={1.15} />
      <primitive object={face} scale={1.15} />
    </group>
  )
}

/* -----------------------------
   preload (ВАЖНО — не удалять)
------------------------------ */

useGLTF.preload(bodyModelUrl)
useGLTF.preload(faceModelUrl)
ITEMS.forEach((item) => useGLTF.preload(item.model))

/* -----------------------------
   Page
------------------------------ */

const StorePage = (): JSX.Element => {
  const [selectedId, setSelectedId] = useState<string>(ITEMS[1].id)

  const selectedItem = useMemo(() => {
    return ITEMS.find((item) => item.id === selectedId) ?? ITEMS[0]
  }, [selectedId])

  const groupedItems = useMemo<GroupedItems>(() => {
    return ITEMS.reduce<GroupedItems>((acc, item) => {
      const key = item.category.toLowerCase()
      acc[key] = acc[key] ?? []
      acc[key].push(item)
      return acc
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
      {/* HEADER */}
      <header style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: '3rem', letterSpacing: '0.08em' }}>
            Store
          </h1>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 999,
            border: '2px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.8)',
            fontWeight: 800,
          }}>
            <span>◉</span>
            <span>{COIN_BALANCE}</span>
          </div>
        </div>
      </header>

      {/* BODY */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 18,
          height: 'min(700px, calc(100vh - 220px))',
        }}
      >
        {/* LEFT */}
        <article style={{ overflowY: 'auto', padding: 20 }}>
          {CATEGORY_SLOTS.map((slot) => {
            const items = groupedItems[slot.label] ?? []

            return (
              <section key={slot.label} style={{ marginBottom: 24 }}>
                <h2 style={{ textTransform: 'lowercase' }}>{slot.title}</h2>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {items.map((item) => (
                    <StoreCard
                      key={item.id}
                      item={item}
                      active={item.id === selectedItem.id}
                      onSelect={() => setSelectedId(item.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </article>

        {/* RIGHT */}
        <aside style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 12 }}>
          <div style={{ height: '100%', borderRadius: 24, overflow: 'hidden' }}>
            <Canvas camera={{ position: [0, 0.3, 5.2], fov: 34 }}>
              <color attach="background" args={['#2c1e52']} />

              <Suspense
                fallback={
                  <Html center>
                    Loading...
                  </Html>
                }
              >
                <Float>
                  <AvatarPreview />
                </Float>
              </Suspense>

              <OrbitControls
                enablePan={false}
                minDistance={4.4}
                maxDistance={6.5}
              />
            </Canvas>
          </div>

          <div>
            <div style={{ fontWeight: 800 }}>{selectedItem.name}</div>
            <div>{selectedItem.price} coins</div>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default StorePage
