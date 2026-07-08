import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { WaterMaterial } from './WaterMaterial'
import noiseTextureUrl from '../../../../assets/textures/fx/t_noise_01.png?url'

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
    foamWidth = 0.2,
    foamSpeed = 0.00,
    foamScale = 1.2,
    waveAmplitude = 0.07,
    waveSpeed1 = [0.01, 0.01],
    waveSpeed2 = [-0.008, 0.008],
    waveScale1 = [6.5, 6.5],
    waveScale2 = [10.5, 10.5],
    shallowOpacity = 0.7,
    deepOpacity = 1.0,
}) => {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<WaterMaterial>(null)

    const { gl, scene, camera, size } = useThree()

    // 1. Create a WebGLRenderTarget with a depth texture matching the screen dimensions
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

    // Load the single noise texture using Fiber's useLoader
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

    // 2. Initialize the custom shader material using screen-space depth uniforms
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
        }
    }, [material, camera.near, camera.far, size.width, size.height, renderTarget])

    // 4. Pre-render pass: render scene depth texture from the main camera's perspective, and update time
    useFrame((state) => {
        if (!meshRef.current || !materialRef.current) return

        const currentWater = meshRef.current
        const currentMaterial = materialRef.current

        // Update uTime for animations
        currentMaterial.time = state.clock.getElapsedTime()

        // Temporarily hide the water plane to prevent rendering it into the depth texture
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
