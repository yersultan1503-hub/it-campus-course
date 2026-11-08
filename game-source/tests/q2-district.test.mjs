import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Q2,Q2_STATIONS} from '../src/districts/q2.js';
import {buildCodingDistrict} from '../src/CodingDistrict.js';
import {Q2_LESSONS,loadLessonMission,startLessonAttempt,submitLessonAnswers} from '../src/courseMissions.js';
import {stationCollider,routePose,roundedPatrol} from '../src/districts/q1.js';
test('five actual Q2 stations have their own kinds, clear entrances and NPC routes',()=>{
 assert.equal(Q2_STATIONS.length,5);assert.deepEqual(Q2_STATIONS.map(l=>l.id),Q2_LESSONS.map(l=>l.id));assert.equal(new Set(Q2.stations.map(s=>s.kind)).size,5);assert.ok(!Q2.avatars.some(a=>a.kind==='naruto'));const colliders=Q2.stations.map(stationCollider);
 const clear=p=>colliders.every(c=>Math.abs(p.x-c.x)>=c.hx||Math.abs(p.z-c.z)>=c.hz);for(const s of Q2.stations)assert.ok(clear({x:s.entry[0],z:s.entry[1]}));for(const route of Object.values(Q2.routes))for(let d=0;d<100;d+=.1)assert.ok(clear(routePose(roundedPatrol(route),d)));
});
test('Q2 coding district renders five different silhouettes without an observatory or Q1 labels',()=>{
 const scene=new THREE.Scene(),labels=[];const sign=(parent,text,w,h,x,y,z)=>{labels.push(text);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial());m.position.set(x,y,z);parent.add(m);return m;};const d=buildCodingDistrict(scene,Q2_STATIONS,sign);assert.equal(d.stationGroups.length,5);assert.ok(scene.getObjectByName('code-forum'));assert.equal(scene.getObjectByName('observatory-dome'),undefined);assert.ok(labels.includes('f(x)'));assert.ok(labels.includes('I/O'));d.setTheme('dark',true);d.setTheme('light',false);scene.updateMatrixWorld(true);scene.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
});
test('each Q2 lesson fetches actual server questions and submits generic evidence, never HTML execution',async()=>{
 for(const entry of Q2_LESSONS){const calls=[],mock=async(path,options)=>{calls.push({path,options});return {ok:true,json:async()=>path.startsWith('/api/lesson/')?{...entry,kind:'lesson',missionId:entry.id+'-mission',mission:{questions:[{id:'q',prompt:'Таңда',options:[{id:'a',label:'A'},{id:'b',label:'B'}]}]}}:path==='/api/attempts'?{attemptId:'a'}:{passed:false,criteria:[]}};};const l=await loadLessonMission(entry.id,mock),attempt=await startLessonAttempt(l,mock);const result=await submitLessonAnswers(attempt.attemptId,l,{q:'a'},mock);assert.equal(result.passed,false);assert.deepEqual(JSON.parse(calls[2].options.body),{answers:{q:'a'}});assert.equal(calls[0].path,'/api/lesson/'+entry.id);}
});
