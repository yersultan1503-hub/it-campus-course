import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mergeCourse,initialLesson,loadLessonMission,submitLessonAnswers} from '../src/courseMissions.js';
import {serverAutomaticGrade} from '../src/serverGrades.js';
import {Q4,Q4_STATIONS} from '../src/districts/q4.js';
import {buildDatabaseDistrict} from '../src/DatabaseDistrict.js';
import {stationCollider,roundedPatrol,routePose} from '../src/districts/q1.js';
test('expanded Q2/Q4 registry admits server instructional lessons, groups into actual district hubs and excludes assessments',async()=>{
 const quarters=[2,4].map(number=>({number,lessons:Array.from({length:12},(_,i)=>({id:`q${number}-${String(i+1).padStart(2,'0')}`,order:i+1,kind:i===11?'assessment':'lesson',title:'Server title '+i}))}));
 const catalog=mergeCourse({quarters});for(const n of [2,4]){const lessons=catalog.filter(l=>l.group==='q'+n);assert.equal(lessons.length,11);assert.ok(lessons.every(l=>l.station>=0&&l.station<(n===2?14:4)));assert.ok(!lessons.some(l=>l.id===`q${n}-12`));}
 assert.ok(!mergeCourse({quarters:[{number:2,lessons:[{id:'q2-01',kind:'assessment',title:'Assessment'}]}]}).some(l=>l.group==='q2'));
 assert.equal(initialLesson('?lesson=q4-08').group,'q4');assert.equal(initialLesson('?lesson=q4-08').pending,true);
 const l={id:'q4-08',kind:'lesson',missionId:'db-8',mission:{questions:[{id:'q',prompt:'Server?',options:[{id:'a',label:'A'},{id:'b',label:'B'}]}]}};
 const calls=[],fetcher=async(path,options)=>{calls.push({path,options});return {ok:true,json:async()=>path.includes('/lesson/')?l:{passed:false,progress:{automaticGrade:{score:0,maxScore:10,correct:0,total:1,attemptId:'a',source:'server'}}}};};
 assert.equal((await loadLessonMission(l.id,fetcher,catalog)).missionId,'db-8');const result=await submitLessonAnswers('a',l,{q:'b'},fetcher,catalog);assert.equal(result.passed,false);assert.equal(serverAutomaticGrade(result.progress).score,0);assert.deepEqual(JSON.parse(calls[1].options.body),{answers:{q:'b'}});
});
test('automatic grade requires validated server provenance and never follows passed, XP or client score',()=>{
 const grade={score:7,maxScore:10,correct:2,total:3,attemptId:'attempt-1',source:'server'};assert.equal(serverAutomaticGrade({automaticGrade:grade}).score,7);
 for(const value of [{passed:true,score:10,XP:999},{automaticGrade:{...grade,source:'local'}},{automaticGrade:{...grade,score:11}},{automaticGrade:{...grade,correct:4}},{automaticGrade:{...grade,attemptId:null}}])assert.equal(serverAutomaticGrade(value),null);
});
test('database harbor has independent geometry, safe paths, four hubs and bounded low lights',()=>{
 const scene=new THREE.Scene(),labels=[];const sign=(parent,text)=>{labels.push(text);};const d=buildDatabaseDistrict(scene,Q4_STATIONS,sign);assert.equal(d.stationGroups.length,4);assert.ok(scene.getObjectByName('database-index-plaza'));assert.equal(scene.getObjectByName('observatory-dome'),undefined);assert.ok(labels.includes('SELECT'));assert.equal(new Set(Q4.stations.map(s=>s.kind)).size,4);
 const colliders=Q4.stations.map(stationCollider),clear=p=>colliders.every(c=>Math.abs(p.x-c.x)>=c.hx||Math.abs(p.z-c.z)>=c.hz);for(const s of Q4.stations)assert.ok(clear({x:s.entry[0],z:s.entry[1]}));for(const route of Object.values(Q4.routes))for(let d=0;d<100;d+=.1)assert.ok(clear(routePose(roundedPatrol(route),d)));
 d.setTheme('dark',true);let lights=0;scene.traverse(o=>{if(o.isPointLight&&o.visible)lights++;});assert.equal(lights,2);d.setTheme('light',false);scene.updateMatrixWorld(true);scene.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
});
