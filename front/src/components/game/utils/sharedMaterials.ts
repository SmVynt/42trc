import * as THREE from 'three'
import paletteTextureUrl from '../../../assets/textures/t_pal.png?url'

// Load the shared palette texture once
const textureLoader = new THREE.TextureLoader()
export const sharedPaletteTexture = textureLoader.load(paletteTextureUrl)

// Configure texture parameters for low-poly/pixel art look
sharedPaletteTexture.colorSpace = THREE.SRGBColorSpace
sharedPaletteTexture.minFilter = THREE.NearestFilter
sharedPaletteTexture.magFilter = THREE.NearestFilter
sharedPaletteTexture.flipY = false

// Cache of created materials to prevent duplicate material objects
const materialCache = new Map<string, THREE.MeshBasicMaterial>()

export interface SharedMaterialOptions {
    transparent?: boolean
    opacity?: number
    side?: THREE.Side
}

/**
 * Gets a cached, shared MeshBasicMaterial using the shared palette texture.
 */
export function getSharedPaletteMaterial(options: SharedMaterialOptions = {}): THREE.MeshBasicMaterial {
    const transparent = options.transparent ?? false
    const opacity = options.opacity ?? 1
    const side = options.side ?? THREE.FrontSide

    // Create a cache key based on configuration
    const key = `${transparent}_${opacity}_${side}`

    if (!materialCache.has(key)) {
        const material = new THREE.MeshBasicMaterial({
            map: sharedPaletteTexture,
            color: '#ffffff',
            transparent,
            opacity,
            side,
        })
        materialCache.set(key, material)
    }

    return materialCache.get(key)!
}
