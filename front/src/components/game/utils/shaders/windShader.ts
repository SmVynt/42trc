export const windVertexShader = `
uniform float uTime;
uniform float uWindSpeed;
uniform float uWindStrength;
uniform float uWindFrequency;
uniform vec3 uWindDirection;
uniform float uMinHeight;
uniform float uMaxHeight;
uniform float uMeshOffsetY;

varying vec2 vUv;

void main() {
    vUv = uv;
    
    // Calculate height in model space (relative to the base of the tree)
    float height = position.y + uMeshOffsetY;
    float windWeight = clamp((height - uMinHeight) / (uMaxHeight - uMinHeight), 0.0, 1.0);

    // Get world position for spatial variation of wind waves
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    // Compute primary wind wave sway based on time and position
    float wave = sin(worldPosition.x * uWindFrequency + worldPosition.z * uWindFrequency + uTime * uWindSpeed) 
               * cos(worldPosition.y * uWindFrequency * 0.5 + uTime * uWindSpeed * 0.7);

    // Add a secondary higher frequency gust/flutter wave
    float flutter = sin(worldPosition.y * uWindFrequency * 4.0 + uTime * uWindSpeed * 2.5) * 0.25;

    // Displacement vector: direction * strength * combined wave * height weight mask
    vec3 windDisplacement = uWindDirection * (wave + flutter) * uWindStrength * windWeight;

    // Apply displacement to local position
    vec3 displacedPosition = position + windDisplacement;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
`;

export const windFragmentShader = `
uniform vec3 uColor;
uniform sampler2D uMap;

varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(uMap, vUv);
    
    // Unlit base color calculation
    vec3 finalColor = texColor.rgb * uColor;

    gl_FragColor = vec4(finalColor, texColor.a);

    // Apply standard Three.js tone mapping and color space correction
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;
