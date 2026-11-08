import {Box3,Raycaster,Vector3} from 'three';

// Visibility only: keep OrbitControls distance and player coordinates untouched.
// Reverse rays also hit a wall when the camera has ended up inside its front face.
export function cameraBlockers(camera,playerPosition,objects){
 const blockers=new Set(),ray=new Raycaster(),right=new Vector3().setFromMatrixColumn(camera.matrixWorld,0).normalize();
 const samples=[[0,.35],[0,1.15],[0,2.05],[-.6,1.15],[.6,1.15],[-1.1,1.15],[1.1,1.15]];
 const anchors=samples.map(([side,height])=>playerPosition.clone().add(new Vector3(0,height,0)).addScaledVector(right,side));
 const guard=Math.max(.35,camera.near*2),bounds=new Box3(),corridor=new Box3().setFromPoints([camera.position,...anchors]).expandByScalar(guard),candidates=[];
 for(const object of objects){
  if(!object.isMesh)continue;
  if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
  bounds.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);
  if(!bounds.intersectsBox(corridor))continue;
  candidates.push(object);
  // Guard the near plane, including a camera already inside a front-sided wall.
  if(bounds.expandByScalar(guard).containsPoint(camera.position))blockers.add(object);
 }
 for(const anchor of anchors){
  const delta=camera.position.clone().sub(anchor),length=delta.length();if(length<.01)continue;
  ray.set(anchor,delta.normalize());ray.near=.02;ray.far=length+camera.near;
  for(const hit of ray.intersectObjects(candidates,false))if(hit.object.isMesh)blockers.add(hit.object);
 }
 return blockers;
}

export function createOcclusionFade(opacity=.06){
 const cache=new Map();let active=new Set();
 function clear(){for(const object of active){const entry=cache.get(object);if(entry)object.material=entry.original;}active.clear();}
 function update(camera,playerPosition,objects){
  clear();
  for(const object of cameraBlockers(camera,playerPosition,objects)){
   if(!cache.has(object)){
    const original=object.material;
    const clone=material=>{const faded=material.clone();faded.transparent=true;faded.opacity=Math.min(material.opacity,opacity);faded.depthWrite=false;return faded;};
    cache.set(object,{original,faded:Array.isArray(original)?original.map(clone):clone(original)});
   }
   const entry=cache.get(object),sources=Array.isArray(entry.original)?entry.original:[entry.original],targets=Array.isArray(entry.faded)?entry.faded:[entry.faded];
   sources.forEach((source,i)=>{const target=targets[i];if(source.color&&target.color)target.color.copy(source.color);if(source.emissive&&target.emissive)target.emissive.copy(source.emissive);if('emissiveIntensity' in source)target.emissiveIntensity=source.emissiveIntensity;target.opacity=Math.min(source.opacity,opacity);});
   object.material=entry.faded;active.add(object);
  }
  return new Set(active);
 }
 function dispose(){clear();for(const {faded} of cache.values())for(const material of Array.isArray(faded)?faded:[faded])material.dispose();cache.clear();}
 return {update,clear,dispose};
}
