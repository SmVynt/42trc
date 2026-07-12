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
const HEAD_BONE_FALLBACKS = ['head', 'mixamorig:head', 'mixamorig_head']
const HEAD_TOP_FALLBACKS = ['head_top_end', 'headtop_end', 'mixamorig:headtop_end', 'mixamorigheadtop_end']

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
}

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
  return accessoryScenes.map(({ kind, scene }) => ({
    kind,
    object: scene.clone(true),
  }))
}

const findNodeByCandidates = (nodes: THREE.Object3D[], candidates: string[]) => {
  const normalizedCandidates = candidates.map((name) => name.toLowerCase())

  const exact = nodes.find((node) => normalizedCandidates.includes(node.name.toLowerCase()))
  if (exact) {
    return exact
  }

  return nodes.find((node) => {
    const normalizedName = node.name.toLowerCase()
    return normalizedCandidates.some((candidate) => normalizedName.includes(candidate))
  })
}

export const attachAccessoriesToBone = (
  root: THREE.Object3D,
  boneName: string,
  accessories: AccessoryInstance[]
) => {
  const allNodes: THREE.Object3D[] = []

  root.traverse((object) => {
    allNodes.push(object)
  })

  const resolveHeadReference = (attachmentTarget: THREE.Object3D): HeadReference => {
    const topNode = allNodes.find((node) => {
      const normalized = node.name.toLowerCase()
      return HEAD_TOP_FALLBACKS.some((candidate) => normalized.includes(candidate))
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
    // object.updateMatrixWorld(true)

    // object.scale.setScalar(headReference.size)
	object.scale.setScalar(100)
	// console.log(`headReferenceSize=${headReference.size}`)
	// object.position.addScaledVector(headReference.topLocal, 0)
  }

  const attachedObjects: THREE.Object3D[] = []

  accessories.forEach(({ kind, object }) => {
    const candidates = [boneName, ...HEAD_BONE_FALLBACKS]

    const attachmentTarget = findNodeByCandidates(allNodes, candidates)
    if (!attachmentTarget) {
      console.warn(`Could not find attachment target for ${kind}`)
      return
    }

    const attachedObject = object.clone(true)
    // const headReference = resolveHeadReference(attachmentTarget)
    // normalizeAccessoryTransform(kind, attachedObject, headReference)
	attachedObject.scale.setScalar(100)

    attachedObject.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        ;(node as THREE.Mesh).frustumCulled = false
      }
    })

    attachedObject.visible = true
    attachmentTarget.add(attachedObject)
    attachedObjects.push(attachedObject)
  })

  return () => {
    attachedObjects.forEach((object) => {
      object.removeFromParent()
    })
  }
}
