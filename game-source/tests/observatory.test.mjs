import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createObservatoryAtmosphere} from '../src/observatoryAtmosphere.js';
import {buildNetworkDistrict} from '../src/NetworkDistrict.js';
import {Q1} from '../src/districts/q1.js';
import {readTheme,saveTheme} from '../src/courseTheme.js';
test('night/day uses the agreed site storage key and tolerates unavailable storage',()=>{
 let entry='light';const storage={getItem:key=>{assert.equal(key,'campus-theme');return entry;},setItem:(key,value)=>{assert.equal(key,'campus-theme');entry=value;}};assert.equal(readTheme(storage),'light');saveTheme(storage,'dark');assert.equal(readTheme(storage),'dark');assert.equal(readTheme({getItem:()=>{throw new Error('no storage');}}),'dark');assert.doesNotThrow(()=>saveTheme({setItem:()=>{throw new Error('no storage');}},'dark'));
});
test('atmosphere is actual sky/forest/light geometry and low mode has bounded lights and foliage',()=>{
 const scene=new THREE.Scene(),atmosphere=createObservatoryAtmosphere(scene);atmosphere.update('dark',false);assert.equal(atmosphere.stars.visible,true);assert.equal(atmosphere.stars.geometry.drawRange.count,1050);assert.equal(atmosphere.crowns.count,216);assert.equal(atmosphere.lights.filter(l=>l.intensity>0).length,4);assert.ok(atmosphere.lights.every(l=>!l.castShadow));
 const objects=scene.children.length;atmosphere.update('light',false);assert.equal(atmosphere.stars.visible,false);assert.equal(atmosphere.lights.filter(l=>l.intensity>0).length,0);atmosphere.update('dark',true);assert.equal(atmosphere.crowns.count,108);assert.equal(atmosphere.lights.filter(l=>l.intensity>0).length,2);assert.equal(atmosphere.lights.filter(l=>l.visible).length,2);assert.ok(atmosphere.pools.every(p=>!p.visible));assert.equal(scene.children.length,objects);
 scene.updateMatrixWorld(true);scene.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));});
});
test('open dome, telescope, warm windows and light/day transition keep mission entrances unchanged',()=>{
 const scene=new THREE.Scene();const sign=(parent,text,w,h,x,y,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial());m.position.set(x,y,z);parent.add(m);return m;};const district=buildNetworkDistrict(scene,Q1.stations.map((s,i)=>({...s,short:String(i),color:'#339ac5'})),sign);
 assert.ok(scene.getObjectByName('observatory-dome'));assert.ok(scene.getObjectByName('open-dome-shell'));assert.ok(scene.getObjectByName('observatory-telescope'));assert.ok(district.warmWindows.length>30);
 const original=district.colliders.map(c=>({...c}));district.setTheme('dark',false);assert.ok(district.warmWindows[0].material.emissiveIntensity>1);assert.equal(district.observatoryLights[0].intensity,14);district.setTheme('light',false);assert.ok(district.warmWindows[0].material.emissiveIntensity<1);assert.equal(district.observatoryLights[0].intensity,0);assert.deepEqual(district.colliders,original);
});
