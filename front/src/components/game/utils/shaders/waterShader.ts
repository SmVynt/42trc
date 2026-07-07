export const waterVertexShader = `
uniform float uTime;
uniform vec2 uWaveSpeed;
uniform vec2 uWaveFrequency;
uniform float uWaveAmplitude;

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec4 vWorldPosition;

void main() {
    vUv = uv;
    
    // Animate vertices vertically to simulate physical waves
    vec3 displacedPosition = position;
    
    // Combine two sine waves for more natural movement
    float wave1 = sin(position.x * uWaveFrequency.x + uTime * uWaveSpeed.x) * 
                  cos(position.z * uWaveFrequency.y + uTime * uWaveSpeed.y);
    float wave2 = sin(position.x * uWaveFrequency.x * 2.3 - uTime * uWaveSpeed.x * 1.7) * 
                  cos(position.z * uWaveFrequency.y * 1.9 - uTime * uWaveSpeed.y * 1.4);
    
    float totalWave = wave1 * 0.7 + wave2 * 0.3;
    displacedPosition.y += totalWave * uWaveAmplitude;
    
    // Transform position
    vec4 modelViewPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = modelViewPosition.xyz;
    vWorldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    
    gl_Position = projectionMatrix * modelViewPosition;
}
`;

export const waterFragmentShader = `
uniform float uTime;
uniform sampler2D uDepthTexture;
uniform vec2 uResolution;
uniform float uCameraNear;
uniform float uCameraFar;

uniform vec3 uShallowColor;
uniform vec3 uDeepColor;
uniform float uMaxDepth;

uniform vec3 uFoamColor;
uniform float uFoamWidth;
uniform float uFoamSpeed;
uniform float uFoamScale;
uniform float uWaveAmplitude;

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec4 vWorldPosition;

// Simple procedural 2D noise generator (avoids needing external textures)
float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Convert perspective depth buffer value to linear view-space depth
float getLinearDepth(float depthVal) {
    float z = depthVal * 2.0 - 1.0; // NDC range [-1, 1]
    return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uCameraNear - z * (uCameraFar - uCameraNear));
}

void main() {
    // 1. Calculate screen coordinates for depth texture sampling
    vec2 screenUV = gl_FragCoord.xy / uResolution;
    
    // 2. Obtain depth value from the depth texture and linearize it
    float rawDepth = texture2D(uDepthTexture, screenUV).r;
    float sceneDepth = getLinearDepth(rawDepth);
    
    // 3. Obtain depth of water fragment (z in view space is negative, so negate it)
    float waterDepth = -vViewPosition.z;
    
    // 4. Calculate depth difference (scene depth - water depth)
    float depthDiff = sceneDepth - waterDepth;
    
    // Treat background/sky (where rawDepth is near 1.0) as max depth to avoid foam artifacting
    if (rawDepth >= 0.999) {
        depthDiff = uMaxDepth;
    }
    
    // Prevent rendering behind the terrain/objects
    depthDiff = max(0.0, depthDiff);
    
    // 5. Generate dynamic noise for foam perturbation
    vec2 foamUV = vWorldPosition.xz * uFoamScale;
    
    // Layered scrolling noise
    float n1 = noise(foamUV + vec2(uTime * uFoamSpeed, uTime * uFoamSpeed * 0.3));
    float n2 = noise(foamUV * 1.5 - vec2(uTime * uFoamSpeed * 0.7, -uTime * uFoamSpeed * 0.4));
    float combinedNoise = n1 * 0.6 + n2 * 0.4;
    
    // Dynamic foam threshold
    float dynamicFoamWidth = uFoamWidth * (0.3 + 0.7 * combinedNoise);
    
    // 6. Water color interpolation based on depth
    float depthFactor = clamp(depthDiff / uMaxDepth, 0.0, 1.0);
    vec3 waterColor = mix(uShallowColor, uDeepColor, depthFactor);
    
    // 7. Shore foam calculation
    float foamFactor = 0.0;
    if (depthDiff < dynamicFoamWidth) {
        foamFactor = 1.0 - (depthDiff / dynamicFoamWidth);
        foamFactor = smoothstep(0.0, 1.0, foamFactor);
    }
    
    // Add wave crest foam on top of peak waves
    // Uses time and world coordinates to create dynamic peaks
    float wavePeaks = sin(vWorldPosition.x * 1.5 + uTime * 2.5) * 
                      cos(vWorldPosition.z * 1.5 + uTime * 2.0);
    
    // Highlight peaks close to the surface
    float crestFoam = smoothstep(0.7, 1.0, wavePeaks) * (1.0 - depthFactor) * 0.35;
    
    // Combine shore foam and crest foam
    float finalFoam = clamp(foamFactor + crestFoam, 0.0, 1.0);
    
    // Blend final water color with foam
    vec3 finalColor = mix(waterColor, uFoamColor, finalFoam);
    
    // Determine opacity: shallow water is transparent, deep water is more opaque, foam is solid
    float baseOpacity = mix(0.4, 0.85, depthFactor);
    float finalOpacity = max(baseOpacity, finalFoam);
    
    gl_FragColor = vec4(finalColor, finalOpacity);
}
`;
