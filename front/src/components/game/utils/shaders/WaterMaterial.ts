import * as THREE from 'three'
import { waterVertexShader, waterFragmentShader } from './waterShader'

export interface WaterMaterialParameters {
    shallowColor?: THREE.ColorRepresentation
    deepColor?: THREE.ColorRepresentation
    foamColor?: THREE.ColorRepresentation
    maxDepth?: number
    foamWidth?: number
    foamSpeed?: number
    foamScale?: number
    waveAmplitude?: number
    waveTexture1?: THREE.Texture | null
    waveTexture2?: THREE.Texture | null
    waveSpeed1?: THREE.Vector2
    waveSpeed2?: THREE.Vector2
    waveScale1?: THREE.Vector2
    waveScale2?: THREE.Vector2
    shallowOpacity?: number
    deepOpacity?: number
}

export class WaterMaterial extends THREE.ShaderMaterial {
    constructor(params: WaterMaterialParameters = {}) {
        const uniforms = {
            uTime: { value: 0.0 },
            uDepthTexture: { value: null as THREE.Texture | null },
            uResolution: { value: new THREE.Vector2(1, 1) },
            uCameraNear: { value: 0.1 },
            uCameraFar: { value: 1000.0 },
            uShallowColor: { value: new THREE.Color(params.shallowColor ?? '#00d2ff') },
            uDeepColor: { value: new THREE.Color(params.deepColor ?? '#003b80') },
            uMaxDepth: { value: params.maxDepth ?? 3.0 },
            uShallowOpacity: { value: params.shallowOpacity ?? 0.3 },
            uDeepOpacity: { value: params.deepOpacity ?? 1.0 },
            uFoamColor: { value: new THREE.Color(params.foamColor ?? '#ffffff') },
            uFoamWidth: { value: params.foamWidth ?? 0.6 },
            uFoamSpeed: { value: params.foamSpeed ?? 0.5 },
            uFoamScale: { value: params.foamScale ?? 0.4 },
            uWaveAmplitude: { value: params.waveAmplitude ?? 0.15 },
            uWaveTexture1: { value: params.waveTexture1 ?? null },
            uWaveTexture2: { value: params.waveTexture2 ?? null },
            uWaveSpeed1: { value: params.waveSpeed1 ?? new THREE.Vector2(0.03, 0.03) },
            uWaveSpeed2: { value: params.waveSpeed2 ?? new THREE.Vector2(-0.02, 0.02) },
            uWaveScale1: { value: params.waveScale1 ?? new THREE.Vector2(2.0, 2.0) },
            uWaveScale2: { value: params.waveScale2 ?? new THREE.Vector2(3.5, 3.5) },
        }

        super({
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            uniforms: uniforms,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
        })
    }

    // Getters and setters to easily modify shader uniforms
    get time(): number {
        return this.uniforms.uTime.value
    }
    set time(val: number) {
        this.uniforms.uTime.value = val
    }

    get depthTexture(): THREE.Texture | null {
        return this.uniforms.uDepthTexture.value
    }
    set depthTexture(val: THREE.Texture | null) {
        this.uniforms.uDepthTexture.value = val
    }

    get resolution(): THREE.Vector2 {
        return this.uniforms.uResolution.value
    }
    set resolution(val: THREE.Vector2) {
        this.uniforms.uResolution.value.copy(val)
    }

    get cameraNear(): number {
        return this.uniforms.uCameraNear.value
    }
    set cameraNear(val: number) {
        this.uniforms.uCameraNear.value = val
    }

    get cameraFar(): number {
        return this.uniforms.uCameraFar.value
    }
    set cameraFar(val: number) {
        this.uniforms.uCameraFar.value = val
    }

    get waveTexture1(): THREE.Texture | null {
        return this.uniforms.uWaveTexture1.value
    }
    set waveTexture1(val: THREE.Texture | null) {
        this.uniforms.uWaveTexture1.value = val
    }

    get waveTexture2(): THREE.Texture | null {
        return this.uniforms.uWaveTexture2.value
    }
    set waveTexture2(val: THREE.Texture | null) {
        this.uniforms.uWaveTexture2.value = val
    }

    get waveSpeed1(): THREE.Vector2 {
        return this.uniforms.uWaveSpeed1.value
    }
    set waveSpeed1(val: THREE.Vector2) {
        this.uniforms.uWaveSpeed1.value.copy(val)
    }

    get waveSpeed2(): THREE.Vector2 {
        return this.uniforms.uWaveSpeed2.value
    }
    set waveSpeed2(val: THREE.Vector2) {
        this.uniforms.uWaveSpeed2.value.copy(val)
    }

    get waveScale1(): THREE.Vector2 {
        return this.uniforms.uWaveScale1.value
    }
    set waveScale1(val: THREE.Vector2) {
        this.uniforms.uWaveScale1.value.copy(val)
    }

    get waveScale2(): THREE.Vector2 {
        return this.uniforms.uWaveScale2.value
    }
    set waveScale2(val: THREE.Vector2) {
        this.uniforms.uWaveScale2.value.copy(val)
    }

    get waveAmplitude(): number {
        return this.uniforms.uWaveAmplitude.value
    }
    set waveAmplitude(val: number) {
        this.uniforms.uWaveAmplitude.value = val
    }

    get shallowOpacity(): number {
        return this.uniforms.uShallowOpacity.value
    }
    set shallowOpacity(val: number) {
        this.uniforms.uShallowOpacity.value = val
    }

    get deepOpacity(): number {
        return this.uniforms.uDeepOpacity.value
    }
    set deepOpacity(val: number) {
        this.uniforms.uDeepOpacity.value = val
    }
}
