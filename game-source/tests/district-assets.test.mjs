import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
import {Q1} from '../src/districts/q1.js';
import {studentFootPose} from '../src/studentGait.js';
// Browser-free asset parsing: use placeholder textures while loading actual geometry,
// normalized skeletons and authored animation tracks from the delivered GLBs/VRMs.
async function load(asset,vrm=false){
 const bytes=await readFile(new URL('../public/assets/'+asset,import.meta.url));const loader=new GLTFLoader();
 loader.register(()=>({name:'headless-textures',loadTexture:()=>Promise.resolve(new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1))}));
 if(vrm)loader.register(parser=>new VRMLoaderPlugin(parser));
 return new Promise((resolve,reject)=>loader.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',resolve,reject));
}
test('actual Q1 civilian assets support normalized distance-driven player/NPC gait',async()=>{
 const assets=new Set([...Q1.avatars.map(a=>a.asset),...Q1.civilians.map(a=>a.asset)].filter(s=>s.endsWith('.vrm')));
 for(const asset of assets){const gltf=await load(asset,true),vrm=gltf.userData.vrm;assert.ok(vrm,asset);VRMUtils.rotateVRM0(vrm);vrm.scene.updateMatrixWorld(true);
  const bone=name=>vrm.humanoid.getNormalizedBoneNode(name);for(const n of ['hips','leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot','leftUpperArm','rightUpperArm'])assert.ok(bone(n),asset+': '+n);
  const pos=name=>bone(name).getWorldPosition(new THREE.Vector3());const thigh=pos('leftUpperLeg').distanceTo(pos('leftLowerLeg')),shin=pos('leftLowerLeg').distanceTo(pos('leftFoot'));assert.ok(thigh>.1&&shin>.1);
  for(let d=0;d<2;d+=.05){for(const [side,offset] of [['left',0],['right',1]]){const pose=studentFootPose(d,offset,thigh,shin);bone(side+'UpperLeg').rotation.x=pose.hip;bone(side+'LowerLeg').rotation.x=pose.knee;bone(side+'Foot').rotation.x=pose.ankle;}vrm.update(1/30);vrm.scene.updateMatrixWorld(true);assert.ok(pos('leftFoot').toArray().every(Number.isFinite));}
  VRMUtils.deepDispose(vrm.scene);
 }
});
test('actual service robot retains Idle/Walking clips with moving skeleton tracks',async()=>{
 const gltf=await load(Q1.service.asset);const mixer=new THREE.AnimationMixer(gltf.scene);
 for(const name of ['Idle','Walking']){const clip=gltf.animations.find(c=>c.name===name);assert.ok(clip,name);assert.ok(clip.duration>0);assert.ok(clip.tracks.length>0);
  mixer.stopAllAction();const action=mixer.clipAction(clip);action.play();mixer.update(.1);const before=[];gltf.scene.traverse(o=>before.push(...o.quaternion.toArray(),...o.position.toArray()));mixer.update(.3);const after=[];gltf.scene.traverse(o=>after.push(...o.quaternion.toArray(),...o.position.toArray()));assert.ok(after.every(Number.isFinite));assert.ok(before.some((n,i)=>Math.abs(n-after[i])>.0001),name+' does not animate');
 }
 mixer.stopAllAction();VRMUtils.deepDispose(gltf.scene);
});
