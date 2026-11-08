import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {cameraBlockers,createOcclusionFade} from '../src/cameraOcclusion.js';
import {buildNetworkDistrict} from '../src/NetworkDistrict.js';
import {Q1} from '../src/districts/q1.js';
import {slideMove} from '../src/movement.js';
function district(){const scene=new THREE.Scene();const sign=(parent,text,w,h,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial());mesh.position.set(x,y,z);parent.add(mesh);return mesh;};return {scene,...buildNetworkDistrict(scene,Q1.stations.map(s=>({...s,short:'Аймақ',color:'#339ac5'})),sign)};}
function dispose(scene){const materials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});materials.forEach(m=>m.dispose());}
test('actual Q1 entry and 350ms W replay fades foreground infrastructure without moving camera/player',()=>{
 const d=district(),entry=Q1.stations[0].entry,player=new THREE.Vector3(entry[0],.1,entry[1]);
 const front=new THREE.Vector3(-Q1.stations[0].position[0],0,-Q1.stations[0].position[1]).normalize(),heading=Math.atan2(-front.x,-front.z);
 const camera=new THREE.PerspectiveCamera(55,1280/720,.1,210),target=player.clone().add(new THREE.Vector3(0,1.35,0));
 camera.position.copy(target).add(new THREE.Vector3(-Math.sin(heading)*5.8,2.5,-Math.cos(heading)*5.8));camera.lookAt(target);camera.updateMatrixWorld(true);
 const targetColumn=d.cameraOccluders.find(mesh=>{const p=mesh.getWorldPosition(new THREE.Vector3());return Math.abs(p.x+3.3)<.001&&Math.abs(p.z+7)<.001&&Math.abs(p.y-2.1)<.001;});assert.ok(targetColumn,'actual entry utility column exists');
 const fade=createOcclusionFade();let structureSeen=false,speed=0;
 for(let frame=0;frame<=21;frame++){
  if(frame){const forward=camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize();speed=THREE.MathUtils.damp(speed,2.1,9,1/60);const next=slideMove(player,forward.multiplyScalar(speed/60),d.colliders,{bounds:Q1.bounds,plaza:false});const delta=new THREE.Vector3(next.x-player.x,0,next.z-player.z);player.add(delta);camera.position.add(delta);target.add(delta);camera.lookAt(target);camera.updateMatrixWorld(true);}
  const beforePlayer=player.clone(),beforeCamera=camera.position.clone();d.scene.updateMatrixWorld(true);
  const active=fade.update(camera,player,d.cameraOccluders);
  if(active.has(targetColumn))structureSeen=true;
  for(const mesh of active){assert.ok(mesh.material.opacity<=.06);assert.equal(mesh.material.depthWrite,false);}
  assert.ok(player.equals(beforePlayer));assert.ok(camera.position.equals(beforeCamera));
 }
 assert.ok(structureSeen,'gantry/utility column must be tested, not only building groups');assert.ok(player.distanceTo(new THREE.Vector3(...[entry[0],.1,entry[1]]))>.4);
 fade.dispose();dispose(d.scene);
});
test('camera inside foreground geometry fades, then restores material identity on clear',()=>{
 const wall=new THREE.Mesh(new THREE.BoxGeometry(2,5,2),Array.from({length:6},()=>new THREE.MeshStandardMaterial()));wall.position.set(0,2,4);wall.updateMatrixWorld(true);
 const camera=new THREE.PerspectiveCamera(55,1,.1,100);camera.position.set(0,2,4);camera.lookAt(0,1,0);camera.updateMatrixWorld(true);
 const original=wall.material,fade=createOcclusionFade();assert.ok(cameraBlockers(camera,new THREE.Vector3(),[wall]).has(wall));fade.update(camera,new THREE.Vector3(),[wall]);assert.notEqual(wall.material,original);for(const m of wall.material)assert.equal(m.opacity,.06);
 original[0].color.set('#ffb866');fade.update(camera,new THREE.Vector3(),[wall]);assert.equal(wall.material[0].color.getHexString(),'ffb866');
 fade.clear();assert.equal(wall.material,original);for(const m of original){assert.equal(m.opacity,1);assert.equal(m.transparent,false);}
 fade.dispose();wall.geometry.dispose();original.forEach(m=>m.dispose());
});
test('open sightline and geometry behind the avatar stay opaque',()=>{
 const wall=new THREE.Mesh(new THREE.BoxGeometry(2,3,.2),new THREE.MeshStandardMaterial());wall.position.set(0,1,-3);wall.updateMatrixWorld(true);
 const camera=new THREE.PerspectiveCamera(55,1,.1,100);camera.position.set(0,2,5);camera.lookAt(0,1,0);camera.updateMatrixWorld(true);
 const original=wall.material,fade=createOcclusionFade();assert.equal(fade.update(camera,new THREE.Vector3(),[wall]).size,0);assert.equal(wall.material,original);fade.dispose();wall.geometry.dispose();original.dispose();
});
