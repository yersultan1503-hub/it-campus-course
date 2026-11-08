import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Original clips stay on their authored skeletons; no cross-rig retargeting.
export function loadGuest({parent,asset,height=1.8,kind,onLoad,onError,isDisposed}){
 new GLTFLoader().load('./assets/'+asset,gltf=>{
  if(isDisposed())return;
  const model=gltf.scene,root=new THREE.Group();root.add(model);
  const bind=[];model.traverse(o=>{if(o.isBone)bind.push({bone:o,q:o.quaternion.clone(),p:o.position.clone()});});
  const mixer=new THREE.AnimationMixer(model);
  const clip=gltf.animations.find(c=>c.duration>0);
  let action=clip?mixer.clipAction(clip):null,idle=null;
  if(kind==='naruto'&&action){
   // Remove horizontal root travel, preserving authored vertical foot contact.
   const run=clip.clone();
   run.tracks=run.tracks.map(track=>{const t=track.clone();if(/Hips.*position/.test(t.name))for(let i=0;i<t.values.length;i+=3){t.values[i]=t.values[0];t.values[i+2]=t.values[2];}return t;});
   action=mixer.clipAction(run);action.play();
   const tracks=[];for(const {bone,q,p} of bind){
    const pose=q.clone();
    if(/(?:Left|Right)Arm$/.test(bone.name)&&bone.children.length){
     model.updateMatrixWorld(true);
     const origin=bone.getWorldPosition(new THREE.Vector3()),end=bone.children[0].getWorldPosition(new THREE.Vector3());
     const direction=end.sub(origin).normalize(),desired=new THREE.Vector3(/Left/.test(bone.name)?.15:-.15,-1,.05).normalize();
     const world=bone.getWorldQuaternion(new THREE.Quaternion()),parentQ=bone.parent.getWorldQuaternion(new THREE.Quaternion());
     pose.copy(parentQ.invert().multiply(new THREE.Quaternion().setFromUnitVectors(direction,desired)).multiply(world));
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(bone.name+'.quaternion',[0,1],[...pose.toArray(),...pose.toArray()]));
    tracks.push(new THREE.VectorKeyframeTrack(bone.name+'.position',[0,1],[...p.toArray(),...p.toArray()]));
   }
   idle=mixer.clipAction(new THREE.AnimationClip('Campus idle',1,tracks));idle.play();action.setEffectiveWeight(0);mixer.update(0);
  } else if(kind==='optimus'&&action){action.setLoop(THREE.LoopPingPong,Infinity).play();mixer.update(0);}
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=height/Math.max(size.y,.001);model.scale.multiplyScalar(scale);model.position.add(new THREE.Vector3(-center.x*scale,-bounds.min.y*scale,-center.z*scale));
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  parent.add(root);
  const bones=[];model.traverse(o=>{if(o.isBone)bones.push(o);});
  const bone=part=>bones.find(o=>o.name.includes(part));
  const rests=new Map(bones.map(b=>[b,b.quaternion.clone()]));
  const rotate=(b,axis,angle)=>{if(b)b.quaternion.copy(rests.get(b)).multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle));};
  const X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
  let distance=0,blend=0,time=0;
  onLoad({root,update(dt,speed,{paused=false,reduced=false}={}){
   if(paused)return;time+=dt;distance+=speed*dt;blend=THREE.MathUtils.damp(blend,Math.min(1,speed/.6),10,dt);
   if(kind==='naruto'&&action){
    // Freeze a planted stride when idle, instead of running in place.
    action.setEffectiveWeight(blend);idle.setEffectiveWeight(1-blend);action.timeScale=speed>.03?Math.max(.2,speed/3):0;mixer.update(dt);
   }
   if(kind==='jerry'){
    const phase=distance*9;
    for(const [side,offset,sign] of [['Left',0,1],['Right',Math.PI,-1]]){
     const s=Math.sin(phase+offset);
     rotate(bone(side+'UpLeg'),X,s*.48*blend);
     rotate(bone(side+'Leg'),X,Math.max(0,-s)*.7*blend);
     rotate(bone(side+'Arm'),Z,sign*1.1);
     const arm=bone(side+'Arm');if(arm)arm.rotateX(-s*.25*blend);
    }
    rotate(bone('Head_'),Y,reduced?0:Math.sin(time*.8)*.08);
   }
   if(kind==='tom'){
    rotate(bone('C_tail_a'),Y,reduced?0:Math.sin(time*1.4)*.18);
    const head=bones.find(b=>b.name.endsWith('_058'));rotate(head,Y,reduced?0:Math.sin(time*.55)*.07);
    root.scale.y=1+(reduced?0:Math.sin(time*1.7)*.003);
   }
   if(kind==='optimus'&&action&&!reduced)mixer.update(dt*.6);
  },dispose(){mixer.stopAllAction();}});
 },undefined,onError);
}
