import { Suspense, useMemo, useState } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import {
  Bounds,
  Center,
  Environment,
  Float,
  Html,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'
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

function applyUnlitMaterial(scene: any, { preserveMap = true } = {}) {
  const next = scene.clone(true)

  next.traverse((child: any) => {
    if (!child.isMesh) return

    child.castShadow = false
    child.receiveShadow = false

    const sourceMaterial = Array.isArray(child.material)
      ? child.material[0]
      : child.material

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

function ItemPreview({
  item,
  selected,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
}: any) {
  const { scene } = useGLTF(item.model)

  const model = useMemo(() => {
    const next = scene.clone(true)

    next.traverse((child: any) => {
      if (!child.isMesh) return

      child.castShadow = false
      child.receiveShadow = false

      const sourceMaterial = Array.isArray(child.material)
        ? child.material[0]
        : child.material

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

  return (
    <primitive
      object={model}
      scale={selected ? 1.15 : 1}
      position={position}
      rotation={rotation}
    />
  )
}

function AvatarPreview({ item }: any) {
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
          <ItemPreview item={item} selected position={[0, 0, 0]} />
        </group>
      </Center>
    </group>
  )
}

function StoreCard({ item, active, onSelect }: any) {
  const style =
    categoryStyles[item.category.toLowerCase() as keyof typeof categoryStyles] ??
    categoryStyles.hats

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'grid',
        gap: 8,
        padding: 10,
        borderRadius: 18,
        border: active
          ? '2px solid var(--color-selected)'
          : `2px solid ${style.borderColor}`,
        background: active ? '#fff6e9' : style.background,
        boxShadow: active
          ? '0 16px 28px rgba(40, 25, 14, 0.14)'
          : '0 10px 20px rgba(32, 22, 15, 0.08)',
        minWidth: 116,
      }}
    >
      <div
        style={{
          height: 128,
          borderRadius: 12,
          border: '1px solid rgba(52, 35, 22, 0.12)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.35))',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Suspense fallback={<span>Loading</span>}>
          <Canvas camera={{ position: [0, 0.35, 3.8], fov: 35 }}>
            <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.35}>
              <Bounds fit clip observe margin={1.2}>
                <Center>
                  <ItemPreview
                    item={item}
                    selected={active}
                    rotation={[Math.PI * 0.02, Math.PI * 0.15, 0]}
                  />
                </Center>
              </Bounds>
            </Float>
          </Canvas>
        </Suspense>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{item.name}</span>
        <span>{item.price}</span>
      </div>

      <span>{item.category}</span>
    </button>
  )
}

const StorePage = (): JSX.Element => {
  const [selectedId, setSelectedId] = useState(ITEMS[1].id)

  const selectedItem = useMemo(
    () => ITEMS.find((i) => i.id === selectedId) ?? ITEMS[0],
    [selectedId]
  )

  const groupedItems = useMemo(() => {
    return ITEMS.reduce<Record<string, any[]>>((groups, item) => {
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
      <header>
        <h1>Store</h1>
        <div>{COIN_BALANCE}</div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 0.95fr',
          gap: 18,
          height: 'min(700px, calc(100vh - 220px))',
        }}
      >
        <article>
          {CATEGORY_SLOTS.map((slot) => {
            const items = groupedItems[slot.label] ?? []

            return (
              <section key={slot.label}>
                <h2>{slot.title}</h2>

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

        <aside>
          <Canvas camera={{ position: [0, 0.3, 5.2], fov: 34 }}>
            <Suspense fallback={<Html>Loading</Html>}>
              <Float>
                <AvatarPreview item={selectedItem} />
              </Float>
            </Suspense>

            <OrbitControls />
          </Canvas>

          <div>
            <strong>{selectedItem.name}</strong>
            <div>{selectedItem.price}</div>
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
