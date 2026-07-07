import React, { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import ground from '../../assets/models/envir/ground_00.glb?url'
import { convertToUnlit } from './utils/unlitMaterial'
import TreesJSON from './spawns/trees.json?url'
import TreePalmModel from '../../assets/models/envir/tree_palm.glb?url'
import { SpawnFromJSON } from './utils/SpawnFromJSON'
import { Water } from './utils/shaders/Water'

const World = () => {
    const { scene } = useGLTF(ground)

    // Clone the ground model and convert it to use unlit MeshBasicMaterials
    const clonedScene = useMemo(() => {
        if (!scene) return null
        const clone = scene.clone()
        convertToUnlit(clone)
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
            />
            <Water position={[0, 0.25, 0]} width={250} height={250} />
        </>
    )
}

export default World