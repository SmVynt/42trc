import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { WaterMaterial } from './WaterMaterial'
// import noiseTextureUrl from '../../../../assets/textures/t_noise_00.png?url'
import noiseTextureUrl from '../../../../assets/textures/fx/t_noise_00.png?url'

interface WaterProps {
    width?: number
    height?: number
    widthSegments?: number
    heightSegments?: number
    position?: [number, number, number]
    rotation?: [number, number, number]
    shallowColor?: string
    deepColor?: string
    foamColor?: string
    maxDepth?: number
    foamWidth?: number
    foamSpeed?: number
    foamScale?: number
    waveAmplitude?: number
    waveSpeed1?: [number, number]
    waveSpeed2?: [number, number]
    waveScale1?: [number, number]
    waveScale2?: [number, number]
    shallowOpacity?: number
    deepOpacity?: number
}

export const Water: React.FC<WaterProps> = ({
    width = 200,
    height = 200,
    widthSegments = 16,
    heightSegments = 16,
    position = [0, 0, 0],
    rotation = [-Math.PI / 2, 0, 0],
    shallowColor = '#39caeb',
    deepColor = '#0253af',
    foamColor = '#ffffff',
    maxDepth = 2.5,
    foamWidth = 0.3,
    foamSpeed = 5.25,
    foamScale = 0.2,
    waveAmplitude = 0.15,
    waveSpeed1 = [0.03, 0.03],
    waveSpeed2 = [-0.02, 0.02],
    waveScale1 = [2.0, 2.0],
    waveScale2 = [3.5, 3.5],
    shallowOpacity = 0.7,
    deepOpacity = 1.0,
}) => {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<WaterMaterial>(null)

    const { gl, scene, camera, size } = useThree()

    // 1. Create a WebGLRenderTarget with a depth texture
    const renderTarget = useMemo(() => {
        const depthTexture = new THREE.DepthTexture(size.width, size.height)

        const target = new THREE.WebGLRenderTarget(size.width, size.height, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
        })

        target.depthTexture = depthTexture
        return target
    }, [size.width, size.height])

    // Clean up render target resource on component unmount
    useEffect(() => {
        return () => {
            renderTarget.dispose()
        }
    }, [renderTarget])

    // Load the noise texture using Fiber's useLoader
    const noiseTexture = useLoader(THREE.TextureLoader, noiseTextureUrl)

    // Configure wrapping parameters for seamless scrolling
    useEffect(() => {
        if (noiseTexture) {
            noiseTexture.wrapS = THREE.RepeatWrapping
            noiseTexture.wrapT = THREE.RepeatWrapping
            noiseTexture.minFilter = THREE.LinearMipmapLinearFilter
            noiseTexture.magFilter = THREE.LinearFilter
            noiseTexture.needsUpdate = true
        }
    }, [noiseTexture])

    // 2. Initialize the custom shader material using the single loaded noise texture twice
    const material = useMemo(() => {
        return new WaterMaterial({
            shallowColor,
            deepColor,
            foamColor,
            maxDepth,
            foamWidth,
            foamSpeed,
            foamScale,
            waveAmplitude,
            waveTexture1: noiseTexture,
            waveTexture2: noiseTexture,
            waveSpeed1: new THREE.Vector2(waveSpeed1[0], waveSpeed1[1]),
            waveSpeed2: new THREE.Vector2(waveSpeed2[0], waveSpeed2[1]),
            waveScale1: new THREE.Vector2(waveScale1[0], waveScale1[1]),
            waveScale2: new THREE.Vector2(waveScale2[0], waveScale2[1]),
            shallowOpacity,
            deepOpacity,
        })
    }, [
        shallowColor,
        deepColor,
        foamColor,
        maxDepth,
        foamWidth,
        foamSpeed,
        foamScale,
        waveAmplitude,
        noiseTexture,
        waveSpeed1,
        waveSpeed2,
        waveScale1,
        waveScale2,
        shallowOpacity,
        deepOpacity,
    ])

    // 3. Keep camera parameters and viewport size in sync with uniforms
    useEffect(() => {
        if (material) {
            material.cameraNear = camera.near
            material.cameraFar = camera.far
            material.resolution = new THREE.Vector2(size.width, size.height)
            material.depthTexture = renderTarget.depthTexture
            material.waveTexture1 = noiseTexture
            material.waveTexture2 = noiseTexture
        }
    }, [material, camera.near, camera.far, size.width, size.height, renderTarget, noiseTexture])

    // 4. Pre-render pass: render scene depth texture, and update dynamic uniforms
    useFrame((state) => {
        if (!meshRef.current || !materialRef.current) return

        const currentWater = meshRef.current
        const currentMaterial = materialRef.current

        // Update uTime for animations
        currentMaterial.time = state.clock.getElapsedTime()

        // Temporarily hide the water plane to avoid self-occlusion in the depth buffer
        currentWater.visible = false

        // Render the scene to our depth target
        const originalRenderTarget = gl.getRenderTarget()
        gl.setRenderTarget(renderTarget)
        gl.render(scene, camera)

        // Restore standard rendering to screen
        gl.setRenderTarget(originalRenderTarget)

        // Restore water plane visibility
        currentWater.visible = true
    })

    return (
        <mesh
            ref={meshRef}
            position={position}
            rotation={rotation}
        >
            <planeGeometry args={[width, height, widthSegments, heightSegments]} />
            <primitive object={material} ref={materialRef} attach="material" />
        </mesh>
    )
}
