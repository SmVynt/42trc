import React, { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import ground from '../../assets/models/envir/ground_01.glb?url'
import { convertToUnlit } from './utils/unlitMaterial'
import TreesJSON from './spawns/trees.json?url'
import TreePalmModel from '../../assets/models/envir/tree_palm.glb?url'
import GrassModel from '../../assets/models/envir/m_grass.glb?url'
import { SpawnFromJSON } from './utils/SpawnFromJSON'
import { Water } from './utils/shaders/Water'

const World = () => {
    const { scene } = useGLTF(ground)

    // Clone the ground model and convert it to use unlit materials with its own textures
    const clonedScene = useMemo(() => {
        if (!scene) return null
        const clone = scene.clone()
        convertToUnlit(clone, 'model')
        clone.traverse((child) => {
            child.layers.enable(1)
        })
        return clone
    }, [scene])

    if (!clonedScene) return null

    return (
        <>
            <RigidBody type="fixed" colliders="trimesh">
                <primitive object={clonedScene} />
            </RigidBody>
            <SpawnFromJSON
                modelUrl={TreePalmModel}
                jsonPath={TreesJSON}
                hasCollision={true}
                collisionShape="cylinder"
                collisionArgs={[3, 0.5]}
                useWind={true}
            />
            <SpawnFromJSON
                modelUrl={GrassModel}
                jsonPath={TreesJSON}
                hasCollision={false}
                useWind={false}
            />
            <Water position={[0, 0.25, 0]} width={250} height={250} />
        </>
    )
}

export default World
