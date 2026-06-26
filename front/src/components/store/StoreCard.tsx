import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, Float, useGLTF } from '@react-three/drei'
import { MeshBasicMaterial, DoubleSide } from 'three'

export type StoreItem = {
  id: string
  category: string
  name: string
  price: number
  model: string
}

type Props = {
  item: StoreItem
  active: boolean
  onSelect: () => void
}

function ItemPreview({ item, active }: { item: StoreItem; active: boolean }) {
  const { scene } = useGLTF(item.model)

  const model = scene.clone(true)

  model.traverse((child: any) => {
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

  return (
    <primitive object={model} scale={active ? 1.15 : 1} />
  )
}

export const StoreCard = ({ item, active, onSelect }: Props) => {
  const categoryStyle =
    item.category.toLowerCase() === 'hats'
      ? { borderColor: '#b8a08e', bg: 'linear-gradient(180deg,#fffdf7,#f2e7dd)' }
      : item.category.toLowerCase() === 'glasses'
      ? { borderColor: '#a3b8c8', bg: 'linear-gradient(180deg,#fbfdff,#e6eef5)' }
      : { borderColor: '#c1b0c6', bg: 'linear-gradient(180deg,#fffdfc,#f3e8f4)' }

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
          ? '2px solid #ffb86b'
          : `2px solid ${categoryStyle.borderColor}`,
        background: active ? '#fff6e9' : categoryStyle.bg,
        boxShadow: active
          ? '0 16px 28px rgba(40,25,14,0.14)'
          : '0 10px 20px rgba(32,22,15,0.08)',
        minWidth: 116,
      }}
    >
      <div
        style={{
          height: 128,
          borderRadius: 12,
          border: '1px solid rgba(52,35,22,0.12)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.35))',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Suspense fallback={<span style={{ fontSize: 12 }}>Loading</span>}>
          <Canvas camera={{ position: [0, 0.3, 3.5], fov: 35 }}>
            <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.3}>
              <Center>
                <ItemPreview item={item} active={active} />
              </Center>
            </Float>
          </Canvas>
        </Suspense>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</span>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{item.price}</span>
      </div>

      <span style={{ fontSize: 11, opacity: 0.7 }}>
        {item.category}
      </span>
    </button>
  )
}
