import React, { useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import ground from '../../assets/models/envir/ground_00.glb?url'
import { convertToUnlit } from './utils/unlitMaterial'
import TreesJSON from './spawns/trees.json?url'
import TreePalmModel from '../../assets/models/envir/tree_palm.glb?url'
import { SpawnFromJSON } from './utils/SpawnFromJSON'

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
        </>
    )
}

export default World