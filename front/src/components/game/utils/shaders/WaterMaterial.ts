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
    waveSpeed?: THREE.Vector2
    waveFrequency?: THREE.Vector2
    waveAmplitude?: number
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
            uFoamColor: { value: new THREE.Color(params.foamColor ?? '#ffffff') },
            uFoamWidth: { value: params.foamWidth ?? 0.6 },
            uFoamSpeed: { value: params.foamSpeed ?? 0.5 },
            uFoamScale: { value: params.foamScale ?? 0.4 },
            uWaveSpeed: { value: params.waveSpeed ?? new THREE.Vector2(1.0, 0.8) },
            uWaveFrequency: { value: params.waveFrequency ?? new THREE.Vector2(0.2, 0.2) },
            uWaveAmplitude: { value: params.waveAmplitude ?? 0.15 },
        }

        super({
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            uniforms: uniforms,
            transparent: true,
            depthWrite: false, // Set to false so objects under transparent water render correctly
            side: THREE.DoubleSide,
        })
    }

    // Getters and setters to easily modify shader uniforms from JavaScript/TypeScript
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
}
