import * as THREE from 'three'
import { windVertexShader, windFragmentShader } from './windShader'

export interface WindMaterialParameters {
    color?: THREE.ColorRepresentation
    map?: THREE.Texture | null
    windSpeed?: number
    windStrength?: number
    windFrequency?: number
    windDirection?: THREE.Vector3
    minHeight?: number
    maxHeight?: number
    meshOffsetY?: number
}

export class WindMaterial extends THREE.ShaderMaterial {
    constructor(params: WindMaterialParameters = {}) {
        const uniforms = {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color(params.color ?? '#ffffff') },
            uMap: { value: params.map ?? null },
            uWindSpeed: { value: params.windSpeed ?? 0.7 },
            uWindStrength: { value: params.windStrength ?? 0.2 },
            uWindFrequency: { value: params.windFrequency ?? 0.5 },
            uWindDirection: { value: params.windDirection ?? new THREE.Vector3(1.0, 0.0, 0.5).normalize() },
            uMinHeight: { value: params.minHeight ?? 3.0 },
            uMaxHeight: { value: params.maxHeight ?? 6.0 },
            uMeshOffsetY: { value: params.meshOffsetY ?? 0.0 },
        }

        super({
            vertexShader: windVertexShader,
            fragmentShader: windFragmentShader,
            uniforms: uniforms,
            vertexColors: false, // Ignoring vertex colors completely
            transparent: false,
            side: THREE.DoubleSide,
            toneMapped: true, // Enable tone mapping to trigger sRGB/Linear color space conversion
        })
    }

    // Getters and setters to easily modify shader uniforms
    get time(): number {
        return this.uniforms.uTime.value
    }
    set time(val: number) {
        this.uniforms.uTime.value = val
    }

    get color(): THREE.Color {
        return this.uniforms.uColor.value
    }
    set color(val: THREE.Color) {
        this.uniforms.uColor.value = val
    }

    get map(): THREE.Texture | null {
        return this.uniforms.uMap.value
    }
    set map(val: THREE.Texture | null) {
        this.uniforms.uMap.value = val
    }

    get windSpeed(): number {
        return this.uniforms.uWindSpeed.value
    }
    set windSpeed(val: number) {
        this.uniforms.uWindSpeed.value = val
    }

    get windStrength(): number {
        return this.uniforms.uWindStrength.value
    }
    set windStrength(val: number) {
        this.uniforms.uWindStrength.value = val
    }

    get windFrequency(): number {
        return this.uniforms.uWindFrequency.value
    }
    set windFrequency(val: number) {
        this.uniforms.uWindFrequency.value = val
    }

    get windDirection(): THREE.Vector3 {
        return this.uniforms.uWindDirection.value
    }
    set windDirection(val: THREE.Vector3) {
        this.uniforms.uWindDirection.value.copy(val)
    }

    get minHeight(): number {
        return this.uniforms.uMinHeight.value
    }
    set minHeight(val: number) {
        this.uniforms.uMinHeight.value = val
    }

    get maxHeight(): number {
        return this.uniforms.uMaxHeight.value
    }
    set maxHeight(val: number) {
        this.uniforms.uMaxHeight.value = val
    }

    get meshOffsetY(): number {
        return this.uniforms.uMeshOffsetY.value
    }
    set meshOffsetY(val: number) {
        this.uniforms.uMeshOffsetY.value = val
    }
}
