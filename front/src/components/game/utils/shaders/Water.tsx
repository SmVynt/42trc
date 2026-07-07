import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { WaterMaterial } from './WaterMaterial'

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
    waveSpeed?: [number, number]
    waveFrequency?: [number, number]
    waveAmplitude?: number
}

export const Water: React.FC<WaterProps> = ({
    width = 100,
    height = 100,
    widthSegments = 64,
    heightSegments = 64,
    position = [0, 0, 0],
    rotation = [-Math.PI / 2, 0, 0],
    shallowColor = '#00d2ff',
    deepColor = '#003b80',
    foamColor = '#ffffff',
    maxDepth = 3.0,
    foamWidth = 0.6,
    foamSpeed = 0.5,
    foamScale = 0.4,
    waveSpeed = [1.0, 0.8],
    waveFrequency = [0.2, 0.2],
    waveAmplitude = 0.15,
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

    // 2. Initialize the custom shader material
    const material = useMemo(() => {
        return new WaterMaterial({
            shallowColor,
            deepColor,
            foamColor,
            maxDepth,
            foamWidth,
            foamSpeed,
            foamScale,
            waveSpeed: new THREE.Vector2(waveSpeed[0], waveSpeed[1]),
            waveFrequency: new THREE.Vector2(waveFrequency[0], waveFrequency[1]),
            waveAmplitude,
        })
    }, [
        shallowColor,
        deepColor,
        foamColor,
        maxDepth,
        foamWidth,
        foamSpeed,
        foamScale,
        waveSpeed,
        waveFrequency,
        waveAmplitude
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
