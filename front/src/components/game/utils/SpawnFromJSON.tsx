import React, { useMemo, useState, useEffect } from 'react'
import { RigidBody, CylinderCollider, CuboidCollider, BallCollider, CapsuleCollider } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { convertToUnlit } from './unlitMaterial'

export interface SpawnItem {
    t?: string
    p: [number, number, number]
    s?: number[]
    r?: number[]
}

export interface SpawnFromJSONProps {
    modelUrl: string
    jsonPath: string
    hasCollision?: boolean
    collisionShape?: 'trimesh' | 'cylinder' | 'cuboid' | 'ball' | 'capsule'
    collisionArgs?: number[]
}

export const SpawnFromJSON = ({
    modelUrl,
    jsonPath,
    hasCollision = false,
    collisionShape = 'trimesh',
    collisionArgs
}: SpawnFromJSONProps) => {
    const { scene } = useGLTF(modelUrl)
    const [spawnData, setSpawnData] = useState<SpawnItem[]>([])

    useEffect(() => {
        fetch(jsonPath)
            .then((res) => res.json())
            .then((data) => setSpawnData(data))
            .catch((err) => console.error('Error fetching spawn JSON:', err))
    }, [jsonPath])

    // Convert the base scene to unlit materials once for efficiency
    const unlitScene = useMemo(() => {
        if (!scene) return null
        const clone = scene.clone()
        convertToUnlit(clone)
        return clone
    }, [scene])

    // Clone and position instances based on JSON properties
    const instances = useMemo(() => {
        if (!unlitScene || spawnData.length === 0) return []

        return spawnData.map((item, index) => {
            const clone = unlitScene.clone()

            // Map coordinates: Blender Z is Three.js Y, Blender Y is Three.js Z
            // Note: Blender Y maps to negative Three.js Z because of the Blender GLTF exporter's Z-up to Y-up rotation
            const [x, y, z] = item.p
            const position: [number, number, number] = [x, z, -y]

            // Map scale: s[0] is uniform scale.
            let scale: [number, number, number] = [1, 1, 1]
            if (item.s && item.s.length > 0) {
                const sx = item.s[0]
                const sy = item.s[1] !== undefined ? item.s[1] : sx
                const sz = item.s[2] !== undefined ? item.s[2] : sx
                scale = [sx, sy, sz]
            }

            // Map rotation: Blender Z rotation is Three.js Y rotation (inverted sign due to axis flip)
            let rotation: [number, number, number] = [0, 0, 0]
            if (item.r && item.r.length > 0) {
                const rx = item.r[0]
                const ry = item.r[2] !== undefined ? -item.r[2] : 0
                const rz = item.r[1] !== undefined ? -item.r[1] : 0
                rotation = [rx, ry, rz]
            }

            return {
                id: index,
                object: clone,
                position,
                rotation,
                scale
            }
        })
    }, [unlitScene, spawnData])

    const renderCollider = () => {
        if (!collisionArgs) return null
        switch (collisionShape) {
            case 'cylinder':
                // CylinderCollider args: [halfHeight, radius]
                return <CylinderCollider args={collisionArgs as [number, number]} />
            case 'cuboid':
                // CuboidCollider args: [halfX, halfY, halfZ]
                return <CuboidCollider args={collisionArgs as [number, number, number]} />
            case 'ball':
                // BallCollider args: [radius]
                return <BallCollider args={collisionArgs as [number]} />
            case 'capsule':
                // CapsuleCollider args: [halfHeight, radius]
                return <CapsuleCollider args={collisionArgs as [number, number]} />
            default:
                return null
        }
    }

    if (instances.length === 0) return null

    return (
        <>
            {instances.map(({ id, object, position, rotation, scale }) => {
                if (hasCollision) {
                    if (collisionShape && collisionShape !== 'trimesh') {
                        return (
                            <RigidBody
                                key={id}
                                type="fixed"
                                colliders={false}
                                position={position}
                                rotation={rotation}
                                scale={scale}
                            >
                                <primitive object={object} />
                                {renderCollider()}
                            </RigidBody>
                        )
                    }
                    return (
                        <RigidBody
                            key={id}
                            type="fixed"
                            colliders="trimesh"
                            position={position}
                            rotation={rotation}
                            scale={scale}
                        >
                            <primitive object={object} />
                        </RigidBody>
                    )
                }
                return (
                    <primitive
                        key={id}
                        object={object}
                        position={position}
                        rotation={rotation}
                        scale={scale}
                    />
                )
            })}
        </>
    )
}
