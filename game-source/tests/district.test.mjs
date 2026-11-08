import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Q1,districtFor,stationCollider,routePose,roundedPatrol} from '../src/districts/q1.js';
import {buildNetworkDistrict} from '../src/NetworkDistrict.js';
import {slideMove} from '../src/movement.js';
const obstacles=[...Q1.stations.map(stationCollider),...Q1.infrastructureColliders];
function walkable(p){return Math.abs(p.x)<Q1.bounds.x&&Math.abs(p.z)<Q1.bounds.z&&obstacles.every(c=>Math.abs(p.x-c.x)>=c.hx||Math.abs(p.z-c.z)>=c.hz);}
test('district routes and every lesson entrance stay outside actual building footprints',()=>{
 for(const s of Q1.stations)assert.ok(walkable({x:s.entry[0],z:s.entry[1]}),s.kind+' entry blocked');
 for(const [name,route] of Object.entries({...Q1.routes,...Object.fromEntries(Object.entries(Q1.routes).map(([id,route])=>[id+'-rounded',roundedPatrol(route)]))}))for(let d=0;d<150;d+=.1){const p=routePose(route,d);assert.ok(walkable(p),name+' blocked at '+d);assert.ok(Number.isFinite(p.heading));}
});
test('Q1 boulevard replaces old fountain collider, but rack and building walls stop movement',()=>{
 assert.deepEqual(slideMove({x:3,z:1},{x:0,z:.1},obstacles,{bounds:Q1.bounds,plaza:false}),{x:3,z:1.1});
 assert.deepEqual(slideMove({x:2,z:0},{x:-.6,z:0},obstacles,{bounds:Q1.bounds,plaza:false}),{x:2,z:0});
 assert.deepEqual(slideMove({x:-9.6,z:-10},{x:-.2,z:0},obstacles,{bounds:Q1.bounds,plaza:false}),{x:-9.6,z:-10});
 assert.deepEqual(slideMove({x:20.9,z:0},{x:.2,z:.1},obstacles,{bounds:Q1.bounds,plaza:false}),{x:20.9,z:.1});
});
test('route wraps continuously and travels straight between corners',()=>{
 const route=[[0,0],[4,0],[4,3],[0,3]];
 assert.deepEqual(routePose(route,0),routePose(route,14));assert.equal(routePose(route,2).x,2);assert.equal(routePose(route,2).z,0);
 assert.ok(Math.hypot(routePose(route,13.999).x,routePose(route,13.999).z)<.002);
 assert.throws(()=>districtFor('q2'));assert.equal(districtFor('q1'),Q1);
});
test('headless scene has distinct building types, a single functioning lab, and finite geometry',()=>{
 const scene=new THREE.Scene();const labels=[];
 const sign=(parent,text,w,h,x,y,z)=>{labels.push(text);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial());m.position.set(x,y,z);parent.add(m);return m;};
 const district=buildNetworkDistrict(scene,Q1.stations.map((s,i)=>({...s,short:'Аймақ '+i,color:'#339ac5'})),sign);
 assert.equal(district.stationGroups.length,8);assert.equal(new Set(district.stationGroups.map(g=>g.userData.kind)).size,8);assert.equal(district.doors.length,1);assert.equal(district.doors[0].i,0);
 assert.equal(labels.filter(s=>s==='КЕЙІН').length,7);assert.ok(district.signals.length>=7);
 scene.updateMatrixWorld(true);let meshes=0;
 scene.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isMesh){meshes++;assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));}});
 assert.ok(meshes>150);assert.ok(meshes<800,'district geometry budget');
 const resources=new Set();scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();resources.add(o.material);}});resources.forEach(m=>m.dispose());
});
