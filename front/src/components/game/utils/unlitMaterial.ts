import * as THREE from 'three'

export function convertToUnlit(scene: THREE.Object3D) {
    scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            const originalMat = mesh.material as THREE.MeshStandardMaterial
            mesh.material = new THREE.MeshBasicMaterial({
                color: originalMat.color,
                map: originalMat.map,
                transparent: originalMat.transparent,
                opacity: originalMat.opacity,
                alphaMap: originalMat.alphaMap,
                side: originalMat.side
            })
        }
    })
}