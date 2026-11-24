import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Raycaster, RingGeometry, Vector3, type Object3D } from 'three'

const haloWidth = 0.19

const vertexShader = /* glsl */ `
  varying vec2 ringPosition;

  void main() {
    ringPosition = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float time;
  uniform float radius;
  uniform float haloWidth;
  varying vec2 ringPosition;

  void main() {
    float distanceToEdge = abs(length(ringPosition) - radius);
    float halo = 1.0 - smoothstep(0.0, haloWidth, distanceToEdge);
    float core = 1.0 - smoothstep(0.011, 0.04, distanceToEdge);
    float angle = atan(ringPosition.y, ringPosition.x);
    float shimmer = 0.5 + 0.5 * sin(3.0 * angle - 2.0 * time);
    float brightness = 0.48 + 0.52 * shimmer;
    vec3 color = mix(vec3(0.025, 0.86, 0.21), vec3(0.69, 1.0, 0.78), core * shimmer);
    gl_FragColor = vec4(color, brightness * (0.36 * halo * halo + 0.64 * core));
  }
`

type InteractionRingProps = {
  ground: Object3D
  position: [number, number, number]
  radius: number
}

export default function InteractionRing({ ground, position, radius }: InteractionRingProps) {
  const [x, y, z] = position
  const geometry = useMemo(() => {
    const ring = new RingGeometry(radius - haloWidth, radius + haloWidth, 128, 4)
    ring.rotateX(-Math.PI / 2)
    const positions = ring.attributes.position
    const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0))
    ground.updateWorldMatrix(true, true)

    for (let index = 0; index < positions.count; index++) {
      ray.ray.origin.set(x + positions.getX(index), y + 5, z + positions.getZ(index))
      const hit = ray.intersectObject(ground)[0]
      positions.setY(index, (hit ? hit.point.y - y : 0) + 0.025)
    }

    positions.needsUpdate = true
    return ring
  }, [ground, radius, x, y, z])

  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    radius: { value: radius },
    haloWidth: { value: haloWidth },
  }), [radius])

  useFrame(({ clock }) => {
    uniforms.time.value = clock.elapsedTime
  })

  return (
    <mesh position={position} geometry={geometry}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
