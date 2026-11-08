import test from 'node:test';
import assert from 'node:assert/strict';
import {Texture} from 'three';
import {districtBoxGeometry,pavingGeometry,districtMaterial} from '../src/districtMaterials.js';
import {roundedPatrol,routePose} from '../src/districts/q1.js';
test('pavement detail keeps physical scale across boulevard and short paths',()=>{
 const a=pavingGeometry(4,.08,35),b=pavingGeometry(4,.08,2);
 for(const [g,length] of [[a,35],[b,2]]){const uv=g.attributes.uv;const us=[8,9,10,11].map(i=>uv.getX(i)),vs=[8,9,10,11].map(i=>uv.getY(i));assert.ok(Math.abs(Math.max(...us)-Math.min(...us)-4/1.5)<1e-5);assert.ok(Math.abs(Math.max(...vs)-Math.min(...vs)-length/1.5)<1e-5);g.dispose();}
});
test('surface roles retain texture maps, dielectric glass and bounded bevels',()=>{
 const normal=new Texture(),roughness=new Texture();const pavement=districtMaterial('#cad5da',0,'paving',{normal,roughness}),glass=districtMaterial('#3b647a',0,'glass'),steel=districtMaterial('#314d60',.4);
 assert.equal(pavement.normalMap,normal);assert.equal(pavement.roughnessMap,roughness);assert.equal(glass.metalness,0);assert.ok(glass.clearcoat>0);assert.ok(steel.roughness<pavement.roughness);
 const beveled=districtBoxGeometry(8,3.1,6),terrain=districtBoxGeometry(46,.65,40);assert.ok(beveled.attributes.position.count>terrain.attributes.position.count);assert.ok([...beveled.attributes.position.array].every(Number.isFinite));
 [beveled,terrain].forEach(g=>g.dispose());[pavement,glass,steel].forEach(m=>m.dispose());normal.dispose();roughness.dispose();
});
test('NPC rounded corners have no hard right-angle tangent or position jump',()=>{
 const route=roundedPatrol([[0,0],[4,0],[4,4],[0,4]],.65);
 let previous=routePose(route,0),maxTurn=0;
 for(let distance=.01;distance<18;distance+=.01){const next=routePose(route,distance);assert.ok(Math.hypot(next.x-previous.x,next.z-previous.z)<.011);const turn=Math.atan2(Math.sin(next.heading-previous.heading),Math.cos(next.heading-previous.heading));maxTurn=Math.max(maxTurn,Math.abs(turn));previous=next;}
 assert.ok(maxTurn<.3);
});
