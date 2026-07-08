import * as THREE from 'three'
import { getSharedPaletteMaterial } from './sharedMaterials'

export type UnlitMode = 'shared' | 'model'

export function convertToUnlit(scene: THREE.Object3D, mode: UnlitMode = 'shared') {
    scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            
            const convertMaterial = (mat: THREE.Material): THREE.Material => {
                const standardMat = mat as THREE.MeshStandardMaterial
                
                if (mode === 'model') {
                    // Create an unlit MeshBasicMaterial using the model's original texture and settings
                    return new THREE.MeshBasicMaterial({
                        map: standardMat.map,
                        color: standardMat.color,
                        transparent: standardMat.transparent,
                        opacity: standardMat.opacity,
                        side: standardMat.side,
                        toneMapped: false,
                    })
                } else {
                    // Apply a cached shared material that reuses the t_pal.png texture
                    return getSharedPaletteMaterial({
                        transparent: standardMat.transparent,
                        opacity: standardMat.opacity,
                        side: standardMat.side
                    })
                }
            }

            if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material.map(convertMaterial)
            } else {
                mesh.material = convertMaterial(mesh.material)
            }
        }
    })
}