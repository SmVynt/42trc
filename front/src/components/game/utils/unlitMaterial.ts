import * as THREE from 'three'
import { getSharedPaletteMaterial } from './sharedMaterials'

export function convertToUnlit(scene: THREE.Object3D) {
    scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            const originalMat = mesh.material as THREE.MeshStandardMaterial
            
            // Apply a cached shared material that reuses the t_pal.png texture
            mesh.material = getSharedPaletteMaterial({
                transparent: originalMat.transparent,
                opacity: originalMat.opacity,
                side: originalMat.side
            })
        }
    })
}