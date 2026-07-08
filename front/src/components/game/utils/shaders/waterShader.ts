export const waterVertexShader = `
uniform float uTime;
uniform float uWaveAmplitude;
uniform sampler2D uWaveTexture1;
uniform sampler2D uWaveTexture2;
uniform vec2 uWaveSpeed1;
uniform vec2 uWaveSpeed2;
uniform vec2 uWaveScale1;
uniform vec2 uWaveScale2;

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec4 vWorldPosition;
varying float vDisplacement;

void main() {
    vUv = uv;
    vec3 displacedPosition = position;
    
    // Compute panning UVs for the two noise textures
    vec2 uv1 = uv * uWaveScale1 + uTime * uWaveSpeed1;
    vec2 uv2 = uv * uWaveScale2 + uTime * uWaveSpeed2;
    
    // Sample the baked noise textures (r channel is sufficient for height displacement)
    float noise1 = texture2D(uWaveTexture1, uv1).r;
    float noise2 = texture2D(uWaveTexture2, uv2).r;
    
    // Add the two noise values together
    float combinedNoise = noise1 * 0.5 + noise2 * 0.5;
    
    // Displace vertices along the local Z axis (world Y)
    float displacement = combinedNoise * uWaveAmplitude;
    displacedPosition.z += displacement;
    
    // Pass displacement to fragment shader to compensate for wave height
    vDisplacement = displacement;
    
    // Compute view and world space positions
    vec4 modelViewPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = modelViewPosition.xyz;
    vWorldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    
    gl_Position = projectionMatrix * modelViewPosition;
}
`;

export const waterFragmentShader = `
uniform float uTime;
uniform sampler2D uDepthTexture; // screen-space depth texture
uniform vec2 uResolution;
uniform float uCameraNear;
uniform float uCameraFar;

uniform vec3 uShallowColor;
uniform vec3 uDeepColor;
uniform float uMaxDepth;
uniform float uShallowOpacity;
uniform float uDeepOpacity;

uniform vec3 uFoamColor;
uniform float uFoamWidth;
uniform float uFoamSpeed;
uniform float uFoamScale;
uniform float uWaveAmplitude;

uniform sampler2D uWaveTexture1;
uniform sampler2D uWaveTexture2;
uniform vec2 uWaveSpeed1;
uniform vec2 uWaveSpeed2;
uniform vec2 uWaveScale1;
uniform vec2 uWaveScale2;

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec4 vWorldPosition;
varying float vDisplacement;

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
    
    // Prevent rendering behind the terrain/objects
    depthDiff = max(0.0, depthDiff);
    
    // Convert view-space depth difference to world-space vertical depth difference
    float verticalDepth = (cameraPosition.y - vWorldPosition.y) * (depthDiff / waterDepth);
    verticalDepth = max(0.0, verticalDepth);
    
    // Compensate for the physical vertex wave displacement to get a stable, flat depth value
    float flatDepth = verticalDepth - vDisplacement;
    flatDepth = max(0.0, flatDepth);
    
    // Treat background/sky (where rawDepth is near 1.0) as max depth
    if (rawDepth >= 0.999) {
        flatDepth = uMaxDepth;
        verticalDepth = uMaxDepth;
    }
    
    // 5. Sample the panning noise textures for the fragment calculations (foam distortion & wave ripples)
    vec2 uv1 = vUv * uWaveScale1 + uTime * uWaveSpeed1;
    vec2 uv2 = vUv * uWaveScale2 + uTime * uWaveSpeed2;
    float noise1 = texture2D(uWaveTexture1, uv1).r;
    float noise2 = texture2D(uWaveTexture2, uv2).r;
    float surfaceNoise = noise1 * 0.5 - noise2 * 0.5;
    
    // Dynamic foam threshold using the combined texture noise
    float dynamicFoamWidth = uFoamWidth * (0.3 + 0.7 * surfaceNoise);
    
    // 6. Water color interpolation based on depth
    float depthFactor = clamp(flatDepth / uMaxDepth, 0.0, 1.0);
    vec3 waterColor = mix(uShallowColor, uDeepColor, depthFactor);
    
    // 7. Shore foam calculation
    // Distort the depth using the panning noise to create a highly organic, wavy shoreline contour
    float distortedDepth = flatDepth - surfaceNoise * 0.25;
    distortedDepth = max(0.0, distortedDepth);
    
    float foamFactor = 0.0;
    if (distortedDepth < uFoamWidth) {
        foamFactor = 1.0 - (distortedDepth / uFoamWidth);
        foamFactor = smoothstep(0.0, 1.0, foamFactor);
    }
    
    // Only use the static shore contact foam
    float finalFoam = foamFactor;
    
    // Add additional visual texture color variation on the main water body
    vec3 waveHighlightColor = vec3(surfaceNoise * 0.08); // Subtle highlight
    vec3 finalColor = mix(waterColor + waveHighlightColor, uFoamColor, finalFoam);
    
    // Determine opacity: shallow water is transparent, deep water is opaque, foam is solid
    float baseOpacity = mix(uShallowOpacity, uDeepOpacity, depthFactor);
    float finalOpacity = mix(baseOpacity, 1.0, finalFoam);
    
    gl_FragColor = vec4(finalColor, finalOpacity);
}
`;
