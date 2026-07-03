import * as THREE from 'three'

import hat01Url from '../../../assets/models/clothes/hat_01.glb?url'
import hat02Url from '../../../assets/models/clothes/hat_02.glb?url'
import hat03Url from '../../../assets/models/clothes/hat_03.glb?url'
import hatCrown01Url from '../../../assets/models/clothes/hat_crown_01.glb?url'
import hatCrown02Url from '../../../assets/models/clothes/hat_crown_02.glb?url'
import glasses01Url from '../../../assets/models/clothes/glasses_01.glb?url'
import glasses02Url from '../../../assets/models/clothes/glasses_02.glb?url'
import glasses03Url from '../../../assets/models/clothes/glasses_03.glb?url'
import face01Url from '../../../assets/models/clothes/_face_01.glb?url'

export const HEAD_BONE_NAME = 'head'
const HEAD_BONE_FALLBACKS = ['head', 'mixamorig:head', 'mixamorig_head', 'headtop_end']

export const HAT_OPTIONS = [hat01Url, hat02Url, hat03Url, hatCrown01Url, hatCrown02Url]
export const GLASSES_OPTIONS = [glasses01Url, glasses02Url, glasses03Url]
export const FACE_OPTIONS = [face01Url]

export type PlayerAppearanceSelection = {
  hatUrl: string
  glassesUrl: string
  faceUrl: string
}

export type AccessoryKind = 'hat' | 'glasses' | 'face'

type AccessorySceneInput = {
  kind: AccessoryKind
  scene: THREE.Object3D
}

type AccessoryInstance = {
  kind: AccessoryKind
  object: THREE.Object3D
  initialPosition: THREE.Vector3
  initialQuaternion: THREE.Quaternion
  initialScale: THREE.Vector3
}

const HEAD_TOP_FALLBACKS = ['head_top_end', 'headtop_end', 'mixamorig:headtop_end', 'mixamorigheadtop_end']
const DEBUG_ACCESSORY_MATERIAL = true
const DEBUG_HEAD_MARKER = true

type HeadReference = {
  size: number
  topLocal: THREE.Vector3
}

export const createRandomPlayerAppearanceSelection = (): PlayerAppearanceSelection => ({
  hatUrl: HAT_OPTIONS[Math.floor(Math.random() * HAT_OPTIONS.length)],
  glassesUrl: GLASSES_OPTIONS[Math.floor(Math.random() * GLASSES_OPTIONS.length)],
  faceUrl: FACE_OPTIONS[0],
})

export const cloneAccessories = (accessoryScenes: AccessorySceneInput[]): AccessoryInstance[] => {
  const clones = accessoryScenes.map(({ kind, scene }) => ({
    kind,
    object: scene.clone(true),
    initialPosition: scene.position.clone(),
    initialQuaternion: scene.quaternion.clone(),
    initialScale: scene.scale.clone(),
  }))

  const cloneSummary = clones.map(({ kind, object }) => {
    let meshCount = 0
    object.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        meshCount += 1
      }
    })

    return {
      kind,
      name: object.name || '(unnamed)',
      uuid: object.uuid,
      meshCount,
      childCount: object.children.length,
    }
  })

  console.log(`[appearance] cloned accessories: ${JSON.stringify(cloneSummary)}`)

  return clones
}

const isDescendantOf = (node: THREE.Object3D, ancestor: THREE.Object3D) => {
  let current: THREE.Object3D | null = node
  while (current) {
    if (current === ancestor) {
      return true
    }
    current = current.parent
  }
  return false
}

const resolveHeadReference = (attachmentTarget: THREE.Object3D, allNodes: THREE.Object3D[]): HeadReference => {
  const topNode = allNodes.find((node) => {
    const normalized = node.name.toLowerCase()
    return isDescendantOf(node, attachmentTarget) && HEAD_TOP_FALLBACKS.some((candidate) => normalized.includes(candidate))
  })

  if (!topNode) {
    return {
      size: 12,
      topLocal: new THREE.Vector3(0, 12, 0),
    }
  }

  const worldTop = new THREE.Vector3()
  topNode.getWorldPosition(worldTop)

  const toLocal = new THREE.Matrix4().copy(attachmentTarget.matrixWorld).invert()
  const localTop = worldTop.applyMatrix4(toLocal)
  const localDistance = localTop.length()

  return {
    size: localDistance > 0 ? localDistance : 12,
    topLocal: localTop,
  }
}

const normalizeAccessoryTransform = (kind: AccessoryKind, object: THREE.Object3D, headReference: HeadReference) => {
  object.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) {
    object.position.set(0, 0, 0)
    object.rotation.set(0, 0, 0)
    object.scale.set(1, 1, 1)
    return
  }

  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  box.getCenter(center)
  box.getSize(size)

  const headReferenceSize = headReference.size
  const upDirection = headReference.topLocal.clone()
  if (upDirection.lengthSq() < 1e-6) {
    upDirection.set(0, 1, 0)
  } else {
    upDirection.normalize()
  }

  object.position.set(-center.x, -center.y, -center.z)

  const maxDim = Math.max(size.x, size.y, size.z)
  const maxFaceDim = Math.max(size.x, size.y)

  const desiredSize =
    kind === 'hat'
      ? headReferenceSize * 0.9
      : kind === 'glasses'
        ? headReferenceSize * 0.55
        : headReferenceSize * 0.8

  const scaleBase = kind === 'glasses' ? maxFaceDim : maxDim
  const autoScale = scaleBase > 0 ? desiredSize / scaleBase : 1
  object.scale.setScalar(autoScale)

  if (kind === 'hat') {
    object.position.addScaledVector(headReference.topLocal, 0.9)
  } else if (kind === 'glasses') {
    object.position.addScaledVector(headReference.topLocal, 0.58)
    object.position.addScaledVector(upDirection, -headReferenceSize * 0.08)
    object.position.z += headReferenceSize * 0.18
  } else if (kind === 'face') {
    object.position.addScaledVector(headReference.topLocal, 0.5)
    object.position.z += headReferenceSize * 0.16
  }
}

const restoreAccessoryTransform = (accessory: AccessoryInstance) => {
  accessory.object.position.copy(accessory.initialPosition)
  accessory.object.quaternion.copy(accessory.initialQuaternion)
  accessory.object.scale.copy(accessory.initialScale)
  accessory.object.updateMatrixWorld(true)
}

export const attachAccessoriesToBone = (
  root: THREE.Object3D,
  boneName: string,
  accessories: AccessoryInstance[]
) => {
  const normalizedBoneName = boneName.toLowerCase()
  const allBones: THREE.Bone[] = []
  const allNodes: THREE.Object3D[] = []

  root.traverse((object) => {
    allNodes.push(object)
    if ((object as THREE.Bone).isBone) {
      allBones.push(object as THREE.Bone)
    }
  })

  const boneByExactName = allBones.find((bone) => bone.name === boneName)
  const boneByCaseInsensitiveName = allBones.find((bone) => bone.name.toLowerCase() === normalizedBoneName)

  const fallbackNames = Array.from(new Set([normalizedBoneName, ...HEAD_BONE_FALLBACKS]))
  const boneByFallback = allBones.find((bone) => fallbackNames.includes(bone.name.toLowerCase()))

  const boneByIncludes = allBones.find((bone) => {
    const normalized = bone.name.toLowerCase()
    return fallbackNames.some((candidate) => normalized.includes(candidate))
  })

  const nodeByExactName = allNodes.find((node) => node.name.toLowerCase() === normalizedBoneName)
  const nodeByFallback = allNodes.find((node) => fallbackNames.includes(node.name.toLowerCase()))
  const nodeByIncludes = allNodes.find((node) => {
    const normalized = node.name.toLowerCase()
    return fallbackNames.some((candidate) => normalized.includes(candidate))
  })

  const attachmentTarget = boneByExactName ?? boneByCaseInsensitiveName ?? boneByFallback ?? boneByIncludes ?? nodeByExactName ?? nodeByFallback ?? nodeByIncludes

  if (!attachmentTarget) {
    const boneNames = allBones.map((candidate) => candidate.name).slice(0, 20)
    const nodeNames = allNodes
      .map((candidate) => candidate.name)
      .filter((name) => name.length > 0)
      .slice(0, 40)
    console.warn(`Could not find attachment target ${boneName} for accessory attach`, { boneNames, nodeNames })
    return () => undefined
  }

  const headReference = resolveHeadReference(attachmentTarget, allNodes)
  console.log(
    `[appearance] attachment target resolved: ${JSON.stringify({
      targetName: attachmentTarget.name || '(unnamed)',
      targetType: attachmentTarget.type,
      headReferenceSize: headReference.size,
      headTopLocal: headReference.topLocal.toArray(),
      incomingAccessories: accessories.length,
      targetChildrenBefore: attachmentTarget.children.length,
    })}`
  )

  accessories.forEach((accessory) => {
    const { kind, object } = accessory
    restoreAccessoryTransform(accessory)
    normalizeAccessoryTransform(kind, object, headReference)

    object.visible = true
    object.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        mesh.frustumCulled = false

        if (DEBUG_ACCESSORY_MATERIAL) {
          const color = kind === 'hat' ? '#ff3b30' : kind === 'glasses' ? '#34c759' : '#0a84ff'
          mesh.material = new THREE.MeshBasicMaterial({
            color,
            side: THREE.DoubleSide,
            depthTest: false,
            transparent: false,
            opacity: 1,
          })
        }
      }
    })

    const localBox = new THREE.Box3().setFromObject(object)
    const localSize = new THREE.Vector3()
    localBox.getSize(localSize)

    console.log(
      `[appearance] attaching accessory: ${JSON.stringify({
        kind,
        name: object.name || '(unnamed)',
        position: object.position.toArray(),
        scale: object.scale.toArray(),
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        bboxSize: localSize.toArray(),
      })}`
    )

    attachmentTarget.add(object)

    const worldPos = new THREE.Vector3()
    object.getWorldPosition(worldPos)
    console.log(
      `[appearance] attached world position: ${JSON.stringify({
        kind,
        name: object.name || '(unnamed)',
        worldPosition: worldPos.toArray(),
      })}`
    )
  })

  let debugMarker: THREE.Mesh | null = null
  if (DEBUG_HEAD_MARKER) {
    const radius = Math.max(0.05, headReference.size * 0.08)
    debugMarker = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 24),
      new THREE.MeshBasicMaterial({
        color: '#ff00ff',
        depthTest: false,
        transparent: false,
      })
    )
    debugMarker.name = 'debug_head_marker'
    debugMarker.renderOrder = 999
    debugMarker.position.copy(headReference.topLocal).multiplyScalar(0.92)
    attachmentTarget.add(debugMarker)
    console.log(
      `[appearance] debug head marker attached: ${JSON.stringify({
        radius,
        position: debugMarker.position.toArray(),
      })}`
    )
  }

  console.log(
    `[appearance] accessories attached: ${JSON.stringify({
      targetName: attachmentTarget.name || '(unnamed)',
      targetChildrenAfter: attachmentTarget.children.length,
    })}`
  )

  return () => {
    accessories.forEach(({ object }) => {
      object.removeFromParent()
    })
    if (debugMarker) {
      debugMarker.removeFromParent()
      debugMarker.geometry.dispose()
      ;(debugMarker.material as THREE.Material).dispose()
    }
  }
}
