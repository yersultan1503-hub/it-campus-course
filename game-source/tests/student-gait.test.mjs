import test from 'node:test';
import assert from 'node:assert/strict';
import {studentFootPose} from '../src/studentGait.js';
test('VRM knees bend anatomically backward and IK reaches the target foot',()=>{
 for(let d=0;d<3;d+=.007){
  const p=studentFootPose(d,0,.43,.4);
  assert.ok(p.knee<=0 && p.knee> -Math.PI*.65);
  const z=-.43*Math.sin(p.hip)-.4*Math.sin(p.hip+p.knee);
  const y=-.43*Math.cos(p.hip)-.4*Math.cos(p.hip+p.knee);
  assert.ok(Math.abs(z-p.z)<1e-9 && Math.abs(y-p.y)<1e-9);
  assert.ok(Math.abs(p.hip+p.knee+p.ankle)<1e-9);
 }
});
test('stance cancels body travel and swing lifts the foot',()=>{
 const a=studentFootPose(.04),b=studentFootPose(.05);
 assert.ok(Math.abs((b.z-a.z)-.01)<1e-9);
 assert.equal(a.lift,0);assert.ok(studentFootPose(.7).lift>0);
});
